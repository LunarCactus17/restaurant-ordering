import path from "node:path";

process.env.DATABASE_URL ??= `file:${path.join(process.cwd(), "prisma", "dev.db")}`;

import { processNextPrintJob } from "@/lib/print-agent";

function getPollIntervalMs() {
  const raw = process.env.PRINT_AGENT_POLL_INTERVAL_MS?.trim();
  const value = raw ? Number(raw) : 5000;

  if (!Number.isFinite(value) || value < 1000) {
    return 5000;
  }

  return Math.floor(value);
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const pollIntervalMs = getPollIntervalMs();

  console.log(
    JSON.stringify(
      {
        status: "STARTED",
        mode: "LOOP",
        pollIntervalMs,
        printerTarget: "DEFAULT_PRINTER",
      },
      null,
      2,
    ),
  );

  while (true) {
    try {
      const result = await processNextPrintJob();
      console.log(JSON.stringify({ checkedAt: new Date().toISOString(), ...result }, null, 2));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown print agent error.";
      console.error(JSON.stringify({ checkedAt: new Date().toISOString(), status: "ERROR", message }, null, 2));
    }

    await sleep(pollIntervalMs);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
