import { prisma } from "@/lib/prisma";

const DEFAULT_PRINTER_TARGET = "DEFAULT_PRINTER";

export async function queueNewOrderPrintJob(orderId: string) {
  return prisma.printJob.create({
    data: {
      orderId,
      trigger: "NEW_ORDER",
      status: "PENDING",
      printerTarget: DEFAULT_PRINTER_TARGET,
    },
  });
}

export async function queueReprintJob(orderId: string, requestedBy?: string) {
  return prisma.printJob.create({
    data: {
      orderId,
      trigger: "REPRINT",
      status: "PENDING",
      printerTarget: DEFAULT_PRINTER_TARGET,
      requestedBy: requestedBy?.trim() || null,
    },
  });
}
