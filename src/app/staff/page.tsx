import { StaffDashboardTabs } from "@/components/ordering/staff-dashboard-tabs";
import { StaffLogoutButton } from "@/components/ordering/staff-logout-button";
import { requireAuthenticatedManager } from "@/lib/auth";
import {
  getDateInputValue,
  getStaffOrderHistoryByDate,
} from "@/lib/staff-order-history";
import { getStaffMenuAvailability } from "@/lib/staff-menu";
import { getActiveStaffOrders } from "@/lib/staff-orders";
import { getStoreSettings } from "@/lib/store-settings";

type StaffPageProps = {
  searchParams?: Promise<{
    historyDate?: string;
    tab?: string;
  }>;
};

export default async function StaffPage({ searchParams }: StaffPageProps) {
  await requireAuthenticatedManager();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const today = new Date();
  const todayDate = getDateInputValue(today);
  const selectedHistoryDate = resolvedSearchParams?.historyDate ?? todayDate;

  const [orders, menuAvailability, storeSettings, selectedHistory] = await Promise.all([
    getActiveStaffOrders(),
    getStaffMenuAvailability(),
    getStoreSettings(),
    getStaffOrderHistoryByDate(selectedHistoryDate),
  ]);
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Staff dashboard
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Pickup staff workspace</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Manage live pickup orders, menu settings, and past order history from one simpler staff page.
              </p>
            </div>
            <StaffLogoutButton />
          </div>
        </section>

        <StaffDashboardTabs
          orders={orders}
          hasOrders={orders.length > 0}
          categories={menuAvailability}
          estimatedPickupMinutes={storeSettings.estimatedPickupMinutes}
          storeWeeklyHours={storeSettings.weeklyHours}
          historyInitialDate={todayDate}
          historySummary={selectedHistory.summary}
          historyOrders={selectedHistory.orders}
        />
      </div>
    </main>
  );
}
