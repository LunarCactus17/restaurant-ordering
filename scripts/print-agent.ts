import path from "node:path";

process.env.DATABASE_URL ??= `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

import { processNextPrintJob } from "@/lib/print-agent";

async function main() {
  const result = await processNextPrintJob();

  if (!result.processed) {
    console.log("NO_PENDING_JOB");
    return;
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
