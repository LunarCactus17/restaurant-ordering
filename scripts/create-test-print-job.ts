import path from "node:path";

process.env.DATABASE_URL ??= `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

import { prisma } from "@/lib/prisma";
import { queueReprintJob } from "@/lib/print-jobs";

async function main() {
  const latestOrder = await prisma.order.findFirst({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      orderNumber: true,
    },
  });

  if (!latestOrder) {
    throw new Error("No order found. Place an order first before creating a test print job.");
  }

  const job = await queueReprintJob(latestOrder.id, "gateway-owner");

  console.log(
    JSON.stringify(
      {
        created: true,
        orderId: latestOrder.id,
        orderNumber: latestOrder.orderNumber,
        printJobId: job.id,
        trigger: job.trigger,
        printerTarget: job.printerTarget,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
