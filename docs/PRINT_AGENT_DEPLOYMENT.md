# Print Agent Deployment Guide

## What this is
The print agent is a separate local Windows process that:
- checks the database for `PENDING` print jobs
- loads the related order
- generates receipt `.txt` and `.pdf` files
- tries to print the PDF to the Windows default printer
- records success or fallback details

The website and the print agent are intentionally separate.

## Development vs production
### Development
- run on the development computer
- useful even when no printer is installed
- falls back to saved `.txt` and `.pdf` files when real printing is unavailable

### Production / store device
- run on the actual Windows device in the store
- printer must be connected to that device
- printer driver must already be installed
- the working printer must be set as the Windows default printer

## Minimum store device requirements
- Windows computer / POS device
- internet access to reach the website/database
- Node.js 20+ installed
- printer driver installed
- thermal printer connected by USB
- printer set as Windows default printer

## Files and commands
From the project folder:

### Install dependencies
```bash
npm install
```

### Make sure Prisma client is ready
```bash
npm run db:generate
```

### Run one check only
```bash
npm run print:agent:once
```

### Run continuously
```bash
npm run print:agent:loop
```

## Suggested store-device environment values
Create or update `.env` on the store device with the real production database connection and staff auth values.

Optional print-agent settings:

```env
PRINT_AGENT_OUTPUT_DIR=./print-agent-output
PRINT_AGENT_POLL_INTERVAL_MS=5000
```

Notes:
- `PRINT_AGENT_OUTPUT_DIR` keeps generated receipt files for debugging.
- `PRINT_AGENT_POLL_INTERVAL_MS` controls how often the local agent checks for new jobs.
- The printer name is not configured here on purpose. The agent uses the Windows default printer.

## Store-device install steps
1. Copy the project to the store Windows device.
2. Install Node.js 20 or newer.
3. Open the project folder in Command Prompt or PowerShell.
4. Run `npm install`.
5. Put the real production `.env` values in place.
6. Run `npm run db:generate`.
7. Confirm the thermal printer works from Windows normally.
8. Set that printer as the Windows default printer.
9. Run `npm run print:agent:once` for a quick test.
10. If that looks good, run `npm run print:agent:loop` and leave it running.

## First real test you can do yourself
1. Log in to the staff page.
2. Use an existing order and trigger `Reprint`.
3. On the store device, watch the terminal running `npm run print:agent:loop`.
4. Confirm the job moves from pending to printed.
5. Confirm the receipt prints from the default printer.

## If printing does not happen
Check these in order:
1. Can Windows print a normal test page to the printer?
2. Is the printer set as the Windows default printer?
3. Does `npm run print:agent:once` produce a `.pdf` file in `print-agent-output`?
4. Does the terminal show a fallback reason?
5. Does the store device have the correct `.env` database connection?

## Important limitation right now
At this stage the agent is still a Node-based script, not yet a packaged Windows service or tray app.
That is okay for early deployment and manual testing.
Once store testing is stable, we can package it more cleanly for easier startup and long-running use.
