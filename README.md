# Restaurant Ordering MVP

A Windows-friendly starter for building a restaurant online ordering website with:

- Next.js App Router
- React + TypeScript
- Tailwind CSS v4
- Prisma ORM
- PostgreSQL-ready Prisma setup for Neon / production deployment

This scaffold is designed to run cleanly in Visual Studio 2022 on Windows while now preparing the project for a Neon Postgres production database.

## Current MVP Scaffold

Included now:

- homepage for the restaurant ordering concept
- sample menu UI with categories, items, and modifiers
- staff dashboard preview route at `/staff`
- Prisma schema for categories, menu items, modifiers, orders, and order items
- local SQLite database setup for development
- seed script with sample menu and sample order data

Not implemented yet:

- live customer cart
- checkout form and order submission
- authentication/authorization for staff pages
- real order status mutations from the UI
- production deployment configuration

## Project Structure

- `src/app` — Next.js routes
- `src/components` — UI sections and reusable components
- `src/lib` — utilities, demo data, shared types, Prisma client
- `prisma/schema.prisma` — data model
- `prisma/seed.ts` — local seed data

## Visual Studio 2022 / Windows Setup

### 1. Prerequisites

Install on Windows:

- Node.js 24.x or a current LTS version
- npm
- Visual Studio 2022
  - open the project folder directly
  - use the built-in terminal for npm commands

### 2. Open the project

Open this folder in VS 2022:

`C:\Users\xuhui\.openclaw\workspace\restaurant-ordering`

### 3. Install dependencies

If needed:

```bash
npm install
```

### 4. Local database

The project is now being prepared for PostgreSQL / Neon deployment.

Environment file:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require"
```

Create/update the database and seed it:

```bash
npm run db:migrate
```

This will:

- connect to the configured PostgreSQL database
- apply the migration
- generate the Prisma client
- run the seed script

If you only want to reseed sample data:

```bash
npm run db:seed
```

### 5. Run the dev server

```bash
npm run dev
```

Then open:

- `http://localhost:3000` — customer-facing starter page
- `http://localhost:3000/staff` — staff dashboard preview

### 6. Production build check

```bash
npm run build
```

Verified in this workspace on Windows: build succeeds.

## Available Scripts

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run start` — run built app
- `npm run lint` — run ESLint
- `npm run db:generate` — regenerate Prisma client
- `npm run db:migrate` — create/apply local Prisma migration
- `npm run db:seed` — reseed local sample data
- `npm run db:studio` — open Prisma Studio

## Notes About Prisma

This scaffold intentionally uses Prisma 6.16.1 right now because it works cleanly with the traditional Prisma schema + migrate workflow used for this MVP and the current Neon/Postgres migration path.

That means:

- the current setup is working and verified
- migration and client generation run successfully
- we can revisit Prisma 8 later if you want, but it is not required to build the MVP

## Next Recommended Implementation Steps

1. Replace demo menu data on the homepage with Prisma-backed queries.
2. Build cart state and item customization UI.
3. Add checkout validation with Zod.
4. Implement order creation and order-number generation.
5. Connect the staff board to real order data and status updates.
6. Add simple staff protection/auth for the dashboard.

## Verification Completed

Verified successfully on this Windows workspace:

- `npm run db:migrate`
- `npm run db:seed`
- `npm run lint`
- `npm run build`
