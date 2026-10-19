"use client";

import { useState, useTransition } from "react";

import { updateEstimatedPickupMinutesAction } from "@/app/staff/actions";
import { formatEstimatedReadyTime } from "@/lib/format";

type StaffPickupEstimatePanelProps = {
  estimatedPickupMinutes: number;
};

export function StaffPickupEstimatePanel({
  estimatedPickupMinutes,
}: StaffPickupEstimatePanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [estimatedMinutesInput, setEstimatedMinutesInput] = useState(String(estimatedPickupMinutes));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Order settings
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Current estimated pickup time</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Set the store-wide estimate shown to customers before they place an order. Keep this close to the orders view so staff can adjust it quickly during busy periods.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Minutes
            <input
              type="number"
              min={5}
              max={180}
              step={5}
              value={estimatedMinutesInput}
              disabled={isPending}
              onChange={(event) => setEstimatedMinutesInput(event.target.value)}
              className="h-10 w-28 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
            />
          </label>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const result = await updateEstimatedPickupMinutesAction(Number(estimatedMinutesInput));
                setMessage(
                  result.message ??
                    (result.success
                      ? "Estimated pickup time updated."
                      : "Unable to update estimated pickup time."),
                );
              });
            }}
            className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save estimate
          </button>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        Customers currently see: Estimated ready in {formatEstimatedReadyTime(estimatedPickupMinutes)}.
      </p>
      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </section>
  );
}
