import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import { getDefaultPrinter, print } from "pdf-to-printer";

import { prisma } from "@/lib/prisma";
import { formatOrderReceipt } from "@/lib/print-receipt";
import type { StaffOrder } from "@/lib/types";

type PrintMode = "PRINTED" | "FILE_FALLBACK";

function getOutputDirectory() {
  return process.env.PRINT_AGENT_OUTPUT_DIR?.trim() || path.join(process.cwd(), "print-agent-output");
}

async function ensureOutputDirectory() {
  const outputDir = getOutputDirectory();
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

function makeBaseFileName(orderNumber: number, trigger: string) {
  return `${new Date().toISOString().replace(/[.:]/g, "-")}_order-${orderNumber}_${trigger}`;
}

async function writeReceiptTextFile(outputDir: string, baseFileName: string, receiptText: string) {
  const textPath = path.join(outputDir, `${baseFileName}.txt`);
  await fs.writeFile(textPath, receiptText, "utf8");
  return textPath;
}

async function writeReceiptPdfFile(outputDir: string, baseFileName: string, order: StaffOrder, receiptText: string) {
  const pdfPath = path.join(outputDir, `${baseFileName}.pdf`);

  const { createWriteStream } = await import("node:fs");

  await new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      size: [226.77, 1000],
      margin: 18,
    });

    const stream = doc.pipe(createWriteStream(pdfPath));

    stream.on("finish", () => resolve());
    stream.on("error", reject);
    doc.on("error", reject);

    doc.font("Courier");
    doc.fontSize(10);
    doc.text(`Order #${order.orderNumber}`, { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(8.5);
    doc.text(receiptText, {
      width: 190,
      align: "left",
      lineGap: 1,
    });
    doc.end();
  });

  return pdfPath;
}

async function claimNextPrintJob() {
  const nextJob = await prisma.printJob.findFirst({
    where: {
      status: "PENDING",
    },
    orderBy: [
      {
        queuedAt: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  if (!nextJob) {
    return null;
  }

  return prisma.printJob.update({
    where: {
      id: nextJob.id,
    },
    data: {
      status: "PROCESSING",
      attempts: {
        increment: 1,
      },
      processedAt: new Date(),
      lastError: null,
    },
  });
}

async function getPrintableOrder(orderId: string): Promise<StaffOrder | null> {
  return prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      orderItems: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          modifiers: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });
}

async function markPrinted(jobId: string, lastError: string | null = null) {
  await prisma.printJob.update({
    where: {
      id: jobId,
    },
    data: {
      status: "PRINTED",
      printedAt: new Date(),
      lastError,
    },
  });
}

async function markFailed(jobId: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown print agent error.";

  await prisma.printJob.update({
    where: {
      id: jobId,
    },
    data: {
      status: "FAILED",
      lastError: message.slice(0, 500),
    },
  });
}

async function tryPrintPdfToDefaultPrinter(pdfPath: string) {
  const defaultPrinter = await getDefaultPrinter();

  if (!defaultPrinter) {
    throw new Error("No Windows default printer is configured on this device.");
  }

  await print(pdfPath, {
    silent: true,
    monochrome: true,
    scale: "fit",
  });

  return defaultPrinter;
}

export async function processNextPrintJob() {
  const job = await claimNextPrintJob();

  if (!job) {
    return { processed: false as const, reason: "NO_PENDING_JOB" as const };
  }

  try {
    const order = await getPrintableOrder(job.orderId);

    if (!order) {
      throw new Error(`Order ${job.orderId} was not found for print job ${job.id}.`);
    }

    const outputDir = await ensureOutputDirectory();
    const receiptText = formatOrderReceipt(order);
    const baseFileName = makeBaseFileName(order.orderNumber, job.trigger);
    const textPath = await writeReceiptTextFile(outputDir, baseFileName, receiptText);
    const pdfPath = await writeReceiptPdfFile(outputDir, baseFileName, order, receiptText);

    let mode: PrintMode = "FILE_FALLBACK";
    let printerName: string | null = null;
    let fallbackReason: string | null = null;

    try {
      const defaultPrinter = await tryPrintPdfToDefaultPrinter(pdfPath);
      mode = "PRINTED";
      printerName = defaultPrinter.name;
    } catch (printError) {
      fallbackReason = printError instanceof Error ? printError.message : "Unknown print fallback reason.";
    }

    await markPrinted(job.id, fallbackReason);

    return {
      processed: true as const,
      mode,
      jobId: job.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      trigger: job.trigger,
      printerTarget: job.printerTarget ?? "DEFAULT_PRINTER",
      printerName,
      pdfPath,
      textPath,
      fallbackReason,
    };
  } catch (error) {
    await markFailed(job.id, error);
    throw error;
  }
}
