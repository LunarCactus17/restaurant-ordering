"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { formatCurrency } from "@/lib/format";
import type { StaffOrder, StaffOrderHistorySummary } from "@/lib/types";

function formatHistoryDateLabel(dateInput: string) {
  const value = new Date(`${dateInput}T12:00:00`);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

function formatSubmittedDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type StaffOrderHistoryTabProps = {
  initialDate: string;
  summary: StaffOrderHistorySummary;
  orders: StaffOrder[];
};

export function StaffOrderHistoryTab({
  initialDate,
  summary,
  orders,
}: StaffOrderHistoryTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Order history
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {formatHistoryDateLabel(summary.date)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review completed and past orders by day. Default view shows today, with quick totals for sales and order count.
            </p>
          </div>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-600">
            Select date
            <input
              type="date"
              value={summary.date}
              max={initialDate}
              disabled={isPending}
              onChange={(event) => {
                const nextDate = event.target.value;

                startTransition(() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set("historyDate", nextDate);
                  router.replace(`/staff?${params.toString()}`);
                });
              }}
              className="h-11 min-w-48 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Total made</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {formatCurrency(summary.totalSalesCents)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">Number of orders</p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {summary.orderCount}
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {orders.length > 0 ? (
          orders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Order #{order.orderNumber}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    {order.customerName?.trim() || "Pickup guest"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{order.phone}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-medium text-slate-500">Submitted</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatSubmittedDateTime(order.createdAt)}
                  </p>
                  <p className="mt-3 text-sm font-medium text-slate-500">Total</p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {formatCurrency(order.totalCents)}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {order.orderItems.map((item) => (
                  <li key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.itemNameSnapshot} ×{item.quantity}
                        </p>
                        {item.modifiers.length > 0 ? (
                          <p className="mt-1 text-xs text-slate-500">
                            {item.modifiers.map((modifier) => modifier.optionNameSnapshot).join(", ")}
                          </p>
                        ) : null}
                        {item.specialInstructions ? (
                          <p className="mt-1 text-xs text-slate-500">Note: {item.specialInstructions}</p>
                        ) : null}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(item.lineTotalCents)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
            No orders found for this day.
          </div>
        )}
      </section>
    </div>
  );
}
