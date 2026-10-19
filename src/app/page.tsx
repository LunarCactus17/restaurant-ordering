import { MenuSection } from "@/components/home/menu-section";
import { formatEstimatedReadyTime } from "@/lib/format";
import { BUSINESS_DAY_LABELS, BUSINESS_DAY_ORDER, formatDailyMenuHours } from "@/lib/menu-hours";
import { getMenuCategories } from "@/lib/menu";
import { getStoreSettings } from "@/lib/store-settings";

export default async function Home() {
  const [categories, storeSettings] = await Promise.all([getMenuCategories(), getStoreSettings()]);
  const businessHours = BUSINESS_DAY_ORDER.map((dayKey) => ({
    day: BUSINESS_DAY_LABELS[dayKey],
    hours: formatDailyMenuHours(storeSettings.weeklyHours[dayKey]),
  }));

  return (
    <main className="min-h-screen bg-[#f6efe6]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="overflow-hidden rounded-[2rem] border border-[#e8d8c2] bg-[#fffaf4] shadow-sm">
          <div className="grid gap-6 px-6 py-7 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-9">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a1662f]">
                  Online pickup ordering
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-[#2f1d14] sm:text-5xl">
                  Lin&apos;s Garden
                </h1>
                <div className="space-y-2 text-sm leading-6 text-[#6f513d] sm:text-base">
                  <p>4350 OH-128, Cleves, OH 45002</p>
                  <p>(513) 353-2808</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 text-sm">
                <span className="rounded-full bg-[#f7e1b8] px-4 py-2 font-semibold text-[#8a581f]">
                  Pickup only
                </span>
                <span className="rounded-full bg-[#f7e1b8] px-4 py-2 font-semibold text-[#8a581f]">
                  Pay in store
                </span>
                <span className="rounded-full bg-[#2f1d14] px-4 py-2 font-semibold text-white">
                  Estimated pickup time: {formatEstimatedReadyTime(storeSettings.estimatedPickupMinutes)}
                </span>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-[#ecdcc8] bg-white p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a1662f]">
                Hours
              </p>
              <div className="mt-4 space-y-2 text-sm text-[#4d3629] sm:text-base">
                {businessHours.map((entry) => (
                  <div key={entry.day} className="flex items-center justify-between gap-4 rounded-2xl bg-[#fff8ef] px-4 py-3">
                    <span className="font-medium">{entry.day}</span>
                    <span>{entry.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <MenuSection
          categories={categories}
          estimatedPickupMinutes={storeSettings.estimatedPickupMinutes}
        />
      </div>
    </main>
  );
}
