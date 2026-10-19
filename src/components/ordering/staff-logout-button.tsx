"use client";

import { useTransition } from "react";

import { logoutManagerAction } from "@/app/staff/login/logout-action";

export function StaffLogoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(async () => {
        await logoutManagerAction();
      })}
      className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Signing out..." : "Logout"}
    </button>
  );
}
