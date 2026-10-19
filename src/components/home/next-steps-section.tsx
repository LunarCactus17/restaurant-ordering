import Link from "next/link";

import { SectionHeading } from "./section-heading";

const nextSteps = [
  "Add staff-side status mutation controls so orders can move from pending to ready and completed.",
  "Protect the staff page with a lightweight MVP auth gate suitable for in-store use.",
  "Refine customer confirmation and error states after live end-to-end testing in VS 2022.",
  "Replace placeholder roadmap copy with restaurant branding and real operating details.",
];

export function NextStepsSection() {
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Immediate next steps"
        title="What the working pickup flow already proves"
        description="The project now has a real customer order path on top of the Windows-friendly scaffold: live menu data, cart behavior, checkout validation, real order creation, and a Prisma-backed staff board."
      />

      <div className="grid gap-6 lg:grid-cols-[0.62fr_0.38fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <ul className="space-y-3 text-sm leading-6 text-slate-700 sm:text-base">
            {nextSteps.map((step) => (
              <li key={step} className="flex gap-3">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-300">
            Manual testing checkpoint
          </p>
          <h3 className="mt-3 text-2xl font-semibold">Ready for your first real run</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            You can now open the folder in VS 2022, run the app locally, place a pickup order,
            and confirm it appears on the staff board with the right order number and phone data.
          </p>
          <Link
            href="/staff"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-orange-100"
          >
            Open staff page
          </Link>
        </div>
      </div>
    </section>
  );
}
