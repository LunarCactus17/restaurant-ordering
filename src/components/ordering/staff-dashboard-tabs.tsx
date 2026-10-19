"use client";

import { useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { StaffAvailabilityPanel } from "@/components/ordering/staff-availability-panel";
import { StaffOrderCard } from "@/components/ordering/staff-order-card";
import { StaffOrderHistoryTab } from "@/components/ordering/staff-order-history-tab";
import { StaffPickupEstimatePanel } from "@/components/ordering/staff-pickup-estimate-panel";
import type {
  StaffMenuCategoryAvailability,
  StaffOrder,
  StaffOrderHistorySummary,
  WeeklyMenuHours,
} from "@/lib/types";

type StaffDashboardTabsProps = {
  orders: StaffOrder[];
  hasOrders: boolean;
  categories: StaffMenuCategoryAvailability[];
  estimatedPickupMinutes: number;
  storeWeeklyHours: WeeklyMenuHours;
  historyInitialDate: string;
  historySummary: StaffOrderHistorySummary;
  historyOrders: StaffOrder[];
};

type StaffTab = "ORDERS" | "MENU" | "HISTORY";

export function StaffDashboardTabs({
  orders,
  hasOrders,
  categories,
  estimatedPickupMinutes,
  storeWeeklyHours,
  historyInitialDate,
  historySummary,
  historyOrders,
}: StaffDashboardTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const requestedHistoryDate = searchParams.get("historyDate");
  const initialTab: StaffTab =
    requestedTab === "MENU" || requestedTab === "HISTORY" || requestedTab === "ORDERS"
      ? requestedTab
      : requestedHistoryDate
        ? "HISTORY"
        : "ORDERS";
  const [activeTab, setActiveTab] = useState<StaffTab>(initialTab);

  useEffect(() => {
    if (activeTab !== "ORDERS") {
      return;
    }

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeTab, router]);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Staff workspace</h2>
            <p className="mt-1 text-sm text-slate-600">
              Switch between open orders, menu settings, and order history so the staff page stays easier to scan.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-slate-300 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("ORDERS")}
              className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                activeTab === "ORDERS"
                  ? "bg-slate-950 text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              Orders
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MENU")}
              className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                activeTab === "MENU"
                  ? "bg-slate-950 text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              Menu settings
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("HISTORY")}
              className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                activeTab === "HISTORY"
                  ? "bg-slate-950 text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              Order history
            </button>
          </div>
        </div>
      </section>

      {activeTab === "ORDERS" ? (
        <div className="space-y-6">
          <StaffPickupEstimatePanel estimatedPickupMinutes={estimatedPickupMinutes} />

          <section className="space-y-4">
            <div className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-950">Open orders</h2>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {orders.length} order{orders.length === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  Show every order that is not complete yet. When staff marks one complete, it disappears from this list.
                </p>
              </div>
            </div>

            {orders.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-3">
                {orders.map((order) => (
                  <StaffOrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : null}
          </section>

          {!hasOrders ? (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
              <h2 className="text-xl font-semibold text-slate-950">No open pickup orders</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Once a customer submits an order, it will appear here automatically until staff marks it complete.
              </p>
            </section>
          ) : null}
        </div>
      ) : activeTab === "MENU" ? (
        <StaffAvailabilityPanel categories={categories} storeWeeklyHours={storeWeeklyHours} />
      ) : (
        <StaffOrderHistoryTab
          initialDate={historyInitialDate}
          summary={historySummary}
          orders={historyOrders}
        />
      )}
    </div>
  );
}
