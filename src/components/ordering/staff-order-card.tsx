"use client";

import { useState, useTransition } from "react";

import { reprintOrderAction, updateOrderStatusAction } from "@/app/staff/actions";
import { formatCurrency } from "@/lib/format";
import type { OrderStatus, StaffOrder } from "@/lib/types";

const statusClasses: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  PREPARING: "bg-sky-100 text-sky-800",
  READY: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-rose-100 text-rose-800",
};

const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const statusActions: { value: OrderStatus; label: string }[] = [
  { value: "COMPLETED", label: "Complete" },
];

function formatSubmittedTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatPickupTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type StaffOrderCardProps = {
  order: StaffOrder;
};

export function StaffOrderCard({ order }: StaffOrderCardProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submitStatusChange = (status: OrderStatus) => {
    if (order.status === status) {
      setStatusMessage(`Order is already ${statusLabels[status].toLowerCase()}.`);
      return;
    }

    setStatusMessage(null);

    startTransition(async () => {
      const result = await updateOrderStatusAction(order.id, status);
      setStatusMessage(result.success ? `Order marked ${statusLabels[status].toLowerCase()}.` : (result.message ?? "Unable to update order status."));
    });
  };

  const queueReprint = () => {
    setStatusMessage(null);

    startTransition(async () => {
      const result = await reprintOrderAction(order.id);
      setStatusMessage(result.success ? "Reprint queued." : (result.message ?? "Unable to queue reprint."));
    });
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Order #{order.orderNumber}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            {order.customerName?.trim() || "Pickup guest"}
          </h2>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[order.status]}`}>
          Open
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-medium text-slate-500">Phone</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">{order.phone}</dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-medium text-slate-500">Submitted</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {formatSubmittedTime(order.createdAt)}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-medium text-slate-500">Pickup time</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {order.requestedPickupAt ? formatPickupTime(order.requestedPickupAt) : "ASAP"}
          </dd>
        </div>
        <div className="rounded-2xl bg-slate-50 p-3">
          <dt className="font-medium text-slate-500">Total</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {formatCurrency(order.totalCents)}
          </dd>
        </div>
      </dl>

      {order.notes ? (
        <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
          <p className="text-sm font-semibold text-orange-900">Pickup note</p>
          <p className="mt-2 text-sm leading-6 text-orange-800">{order.notes}</p>
        </div>
      ) : null}

      <div className="mt-5">
        <p className="text-sm font-semibold text-slate-900">Items</p>
        <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
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
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Pickup verification
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Ask for order #{order.orderNumber} and confirm phone {order.phone} before handoff.
        </p>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Order actions</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={queueReprint}
            className="inline-flex h-10 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reprint
          </button>
          {statusActions.map((action) => (
            <button
              key={action.value}
              type="button"
              disabled={isPending || order.status === action.value}
              onClick={() => submitStatusChange(action.value)}
              className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {action.label}
            </button>
          ))}
        </div>
        {statusMessage ? <p className="mt-3 text-sm text-slate-600">{statusMessage}</p> : null}
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Reprint sends this order back into the print queue. Complete removes it from the open orders list after pickup is handed off.
        </p>
      </div>
    </article>
  );
}
