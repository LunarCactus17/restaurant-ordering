import path from "node:path";

process.env.DATABASE_URL ??= `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

import { prisma } from "@/lib/prisma";

async function main() {
  const jobs = await prisma.printJob.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
    select: {
      id: true,
      orderId: true,
      status: true,
      trigger: true,
      printerTarget: true,
      attempts: true,
      lastError: true,
      createdAt: true,
      processedAt: true,
      printedAt: true,
    },
  });

  console.log(JSON.stringify(jobs, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
