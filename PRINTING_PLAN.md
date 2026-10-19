# Printing Plan - Step 1

## Goal
Add the website-side printing foundation before connecting a real thermal printer.

## Chosen architecture
- Online website: Vercel
- Online database: Neon Postgres
- In-store print bridge: Windows 7/8 POS computer running a local print agent
- Thermal printer: connected to that in-store device by USB
- Printing target rule: always print to the device's current default/main printer instead of binding to a fixed printer name

## Step 1 delivered in code
- Add `PrintJob` model for queued print work
- Automatically create one `NEW_ORDER` print job when an order is placed
- Add staff-side `Reprint` action that creates a `REPRINT` print job
- Keep actual printer communication out of the web app

## Print job lifecycle
- `PENDING`: waiting for local print agent
- `PROCESSING`: claimed by local print agent
- `PRINTED`: printed successfully
- `FAILED`: print attempt failed

## Current development implementation
The local Windows print agent now:
1. claims the next `PENDING` print job
2. loads the related order data
3. formats receipt text
4. writes `.txt` and `.pdf` receipt artifacts for development/debugging
5. tries to print the generated PDF to the Windows device's current default/main printer
6. if printing is unavailable in development, keeps the output files as fallback evidence and records the fallback reason

## Production deployment note
- The website and the in-store print agent are separate pieces.
- In development, the print agent runs on this local development machine.
- In production, we will need to install and run the print agent/app on the actual Windows device in the store that is connected to the printer.
- As long as the store device has the printer driver installed and the working printer is set as the Windows default printer, website code should not need printer-name changes.
- For now, store deployment is a Node-based local script workflow (`print:agent:once` / `print:agent:loop`) so the owner can manually install and test it on the store device.

## Printer targeting decision
- Do not hardcode a printer name.
- The store device may replace the printer in the future.
- As long as the replacement printer is installed and set as the Windows default printer, the print agent should keep working without app changes.
