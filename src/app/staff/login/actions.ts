"use server";

import { redirect } from "next/navigation";

import {
  clearManagerLoginFailures,
  createManagerSession,
  isManagerLoginLocked,
  recordFailedManagerLogin,
  verifyManagerPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type StaffLoginResult = {
  success: boolean;
  message?: string;
};

export async function loginManagerAction(
  _previousState: StaffLoginResult,
  formData: FormData,
): Promise<StaffLoginResult> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/staff");

  if (!username || !password) {
    return {
      success: false,
      message: "Username and password are required.",
    };
  }

  const manager = await prisma.managerAccount.findUnique({
    where: {
      username,
    },
    select: {
      id: true,
      passwordHash: true,
      lockedUntil: true,
    },
  });

  if (!manager) {
    return {
      success: false,
      message: "Invalid credentials.",
    };
  }

  if (isManagerLoginLocked(manager.lockedUntil)) {
    return {
      success: false,
      message: "Too many failed login attempts. Please wait 15 minutes and try again.",
    };
  }

  const isValid = await verifyManagerPassword(manager.passwordHash, password);

  if (!isValid) {
    const result = await recordFailedManagerLogin(manager.id);

    return {
      success: false,
      message: result.locked
        ? "Too many failed login attempts. Please wait 15 minutes and try again."
        : "Invalid credentials.",
    };
  }

  await clearManagerLoginFailures(manager.id);
  await createManagerSession(manager.id);
  redirect(next.startsWith("/staff") ? next : "/staff");
}
