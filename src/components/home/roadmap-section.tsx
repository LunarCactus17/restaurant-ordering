import { SectionHeading } from "./section-heading";

const milestones = [
  {
    title: "Phase 1 — Project foundation",
    timeframe: "Done",
    tasks: [
      "Finalize the pickup-only MVP rules and verification flow",
      "Align the Prisma data model with pickup + phone verification",
      "Keep the project buildable and Windows / VS 2022 friendly",
    ],
  },
  {
    title: "Phase 2 — Customer ordering workflow",
    timeframe: "In progress",
    tasks: [
      "Serve the menu from Prisma-backed SQLite data",
      "Support item customization, cart state, and checkout submission",
      "Create customer-facing order numbers and confirmation details",
    ],
  },
  {
    title: "Phase 3 — Staff operations",
    timeframe: "Next",
    tasks: [
      "Add live status update actions on the staff board",
      "Support payment received toggles and smoother handoff workflow",
      "Add a lightweight protection layer for in-store staff access",
    ],
  },
];

export function RoadmapSection() {
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Delivery plan"
        title="Implementation roadmap for the pickup MVP"
        description="The project has moved past a static scaffold and into a real operational slice. The next work is focused on staff controls, protection, and refinement after live manual testing."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {milestones.map((milestone) => (
          <article key={milestone.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">
                {milestone.timeframe}
              </p>
              <h3 className="text-xl font-semibold text-slate-950">{milestone.title}</h3>
              <ul className="space-y-2 text-sm leading-6 text-slate-600">
                {milestone.tasks.map((task) => (
                  <li key={task} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
