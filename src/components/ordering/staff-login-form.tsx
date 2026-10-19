"use client";

import { useActionState } from "react";

import { loginManagerAction, type StaffLoginResult } from "@/app/staff/login/actions";

const initialState: StaffLoginResult = {
  success: false,
};

type StaffLoginFormProps = {
  nextPath: string;
};

export function StaffLoginForm({ nextPath }: StaffLoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginManagerAction, initialState);

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="next" value={nextPath} />

      <div>
        <label htmlFor="username" className="text-sm font-medium text-slate-700">
          Manager username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          disabled={isPending}
          className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          disabled={isPending}
          className="mt-2 h-11 w-full rounded-xl border border-slate-300 px-3 text-sm text-slate-900"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 w-full items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      {state.message ? <p className="text-sm text-rose-600">{state.message}</p> : null}
    </form>
  );
}
