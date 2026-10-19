"use server";

import { redirect } from "next/navigation";

import { clearManagerSession } from "@/lib/auth";

export async function logoutManagerAction() {
  await clearManagerSession();
  redirect("/staff/login");
}
