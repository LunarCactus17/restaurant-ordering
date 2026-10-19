import Link from "next/link";

import { formatEstimatedReadyTime } from "@/lib/format";

type HeroProps = {
  estimatedPickupMinutes: number;
};

export function Hero({ estimatedPickupMinutes }: HeroProps) {
  return (
    <section className="grid gap-8 rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-950/10 lg:grid-cols-[1.35fr_0.65fr] lg:px-10 lg:py-10">
      <div className="space-y-5">
        <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-orange-200">
          Restaurant Ordering MVP
        </span>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Run a simple pickup flow without third-party delivery fees.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            This MVP is now aligned to the pickup-only spec: guests browse the all-day menu,
            including Side Order add-ons, customize items, place a pickup order, and verify in
            store with their order number and phone number before paying at pickup.
          </p>
          <p className="max-w-2xl rounded-2xl border border-orange-400/20 bg-orange-500/10 px-4 py-3 text-sm leading-6 text-orange-100">
            Estimated ready in {formatEstimatedReadyTime(estimatedPickupMinutes)}. Staff can adjust this estimate live when the kitchen gets busier.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/#menu"
            className="inline-flex h-12 items-center justify-center rounded-full bg-orange-500 px-5 font-medium text-slate-950 transition hover:bg-orange-400"
          >
            Browse menu
          </Link>
          <Link
            href="/cart"
            className="inline-flex h-12 items-center justify-center rounded-full border border-orange-300/40 bg-orange-500/10 px-5 font-medium text-orange-100 transition hover:bg-orange-500/20"
          >
            Open cart page
          </Link>
          <Link
            href="/staff"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-5 font-medium text-white transition hover:bg-white/10"
          >
            Open staff board
          </Link>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="rounded-2xl bg-white p-4 text-slate-950">
          <p className="text-sm font-medium text-slate-500">Guest pickup flow</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            <li>1. Browse menu by category</li>
            <li>2. Customize items and add to cart</li>
            <li>3. Review everything on the cart page</li>
            <li>4. Place order with phone number and pay at pickup</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
          <p className="text-sm font-medium text-slate-300">Current scaffold includes</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
            <li>• Next.js App Router + TypeScript</li>
            <li>• Tailwind CSS v4 setup</li>
            <li>• Prisma-backed menu and order reads</li>
            <li>• Windows-friendly local SQLite dev database</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
