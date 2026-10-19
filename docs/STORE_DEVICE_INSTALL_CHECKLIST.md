# Store Device Install Checklist

## Before install
- [ ] Windows device is available in the store
- [ ] Printer driver is installed
- [ ] Thermal printer is connected by USB
- [ ] Printer can print a Windows test page
- [ ] Printer is set as the Windows default printer
- [ ] Internet access works on the device
- [ ] Real production `.env` values are ready

## Install
- [ ] Copy project files to the store device
- [ ] Install Node.js 20+
- [ ] Open terminal in the project folder
- [ ] Run `npm install`
- [ ] Run `npm run db:generate`
- [ ] Put the correct production `.env` in place

## First test
- [ ] Run `npm run print:agent:once`
- [ ] Confirm no dependency/runtime error appears
- [ ] Confirm `print-agent-output` receives `.txt`/`.pdf` files if needed
- [ ] Create or reprint an order from the website
- [ ] Confirm receipt prints from the default printer

## Keep it running
- [ ] Run `npm run print:agent:loop`
- [ ] Keep the terminal open during testing
- [ ] Confirm new orders are printed automatically
