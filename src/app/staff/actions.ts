"use server";

import { revalidatePath } from "next/cache";

import { getAuthenticatedManager, requireAuthenticatedManager } from "@/lib/auth";
import {
  updateCategoryManualOrderingOpen,
  updateCategoryDescription,
  updateCategorySchedule,
  updateCategoryWeeklyHours,
  updateMenuItemManualOrderingOpen,
} from "@/lib/staff-menu";
import { updateStaffOrderStatus } from "@/lib/staff-orders";
import { updateEstimatedPickupMinutes, updateStoreWeeklyHours } from "@/lib/store-settings";
import { normalizeWeeklyMenuHours } from "@/lib/menu-hours";
import { queueReprintJob } from "@/lib/print-jobs";
import type { OrderStatus, WeeklyMenuHours } from "@/lib/types";

const allowedStatuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "COMPLETED",
  "CANCELLED",
];

export type StaffMutationResult = {
  success: boolean;
  message?: string;
};

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  if (!orderId.trim()) {
    return {
      success: false,
      message: "Order id is required.",
    };
  }

  if (!allowedStatuses.includes(status)) {
    return {
      success: false,
      message: "Invalid order status.",
    };
  }

  try {
    await updateStaffOrderStatus(orderId, status);
    revalidatePath("/staff");

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update order status.",
    };
  }
}

export async function reprintOrderAction(orderId: string): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  if (!orderId.trim()) {
    return {
      success: false,
      message: "Order id is required.",
    };
  }

  try {
    const manager = await getAuthenticatedManager();
    await queueReprintJob(orderId, manager?.username);
    revalidatePath("/staff");

    return {
      success: true,
      message: "Reprint queued.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to queue reprint.",
    };
  }
}

export async function updateCategoryAvailabilityAction(
  categoryId: string,
  manualOrderingOpen: boolean,
): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  if (!categoryId.trim()) {
    return {
      success: false,
      message: "Category id is required.",
    };
  }

  try {
    await updateCategoryManualOrderingOpen(categoryId, manualOrderingOpen);
    revalidatePath("/");
    revalidatePath("/staff");

    return {
      success: true,
      message: manualOrderingOpen ? "Category opened for ordering." : "Category closed for ordering.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update category availability.",
    };
  }
}

function normalizeHourInput(value: number | null) {
  if (value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value < 0 || value > 23) {
    throw new Error("Hours must be whole numbers from 0 to 23.");
  }

  return value;
}

export async function updateCategoryScheduleAction(
  categoryId: string,
  availableFromHour: number | null,
  availableUntilHour: number | null,
): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  if (!categoryId.trim()) {
    return {
      success: false,
      message: "Category id is required.",
    };
  }

  try {
    const normalizedFromHour = normalizeHourInput(availableFromHour);
    const normalizedUntilHour = normalizeHourInput(availableUntilHour);

    await updateCategorySchedule(categoryId, normalizedFromHour, normalizedUntilHour);
    revalidatePath("/");
    revalidatePath("/staff");

    return {
      success: true,
      message:
        normalizedFromHour === null && normalizedUntilHour === null
          ? "Category schedule set to all day."
          : "Category schedule updated.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update category schedule.",
    };
  }
}

export async function updateCategoryDescriptionAction(
  categoryId: string,
  description: string,
): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  if (!categoryId.trim()) {
    return {
      success: false,
      message: "Category id is required.",
    };
  }

  const normalizedDescription = description.trim();

  if (normalizedDescription.length > 200) {
    return {
      success: false,
      message: "Category description must be 200 characters or less.",
    };
  }

  try {
    await updateCategoryDescription(categoryId, normalizedDescription.length > 0 ? normalizedDescription : null);
    revalidatePath("/");
    revalidatePath("/staff");

    return {
      success: true,
      message: normalizedDescription.length > 0 ? "Category description updated." : "Category description cleared.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update category description.",
    };
  }
}

export async function updateEstimatedPickupMinutesAction(
  estimatedPickupMinutes: number,
): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  if (!Number.isInteger(estimatedPickupMinutes) || estimatedPickupMinutes < 5 || estimatedPickupMinutes > 180) {
    return {
      success: false,
      message: "Estimated pickup time must be a whole number between 5 and 180 minutes.",
    };
  }

  try {
    await updateEstimatedPickupMinutes(estimatedPickupMinutes);
    revalidatePath("/");
    revalidatePath("/staff");

    return {
      success: true,
      message: `Estimated pickup time updated to about ${estimatedPickupMinutes} minutes.`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update estimated pickup time.",
    };
  }
}

export async function updateMenuItemAvailabilityAction(
  menuItemId: string,
  manualOrderingOpen: boolean,
): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  if (!menuItemId.trim()) {
    return {
      success: false,
      message: "Menu item id is required.",
    };
  }

  try {
    await updateMenuItemManualOrderingOpen(menuItemId, manualOrderingOpen);
    revalidatePath("/");
    revalidatePath("/staff");

    return {
      success: true,
      message: manualOrderingOpen ? "Item opened for ordering." : "Item closed for ordering.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update item availability.",
    };
  }
}

export async function updateCategoryWeeklyHoursAction(
  categoryId: string,
  rawWeeklyHours: WeeklyMenuHours,
): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  if (!categoryId.trim()) {
    return {
      success: false,
      message: "Category id is required.",
    };
  }

  try {
    await updateCategoryWeeklyHours(categoryId, normalizeWeeklyMenuHours(rawWeeklyHours));
    revalidatePath("/");
    revalidatePath("/staff");

    return {
      success: true,
      message: "Menu hours updated.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update menu hours.",
    };
  }
}

export async function updateStoreWeeklyHoursAction(rawWeeklyHours: WeeklyMenuHours): Promise<StaffMutationResult> {
  await requireAuthenticatedManager();

  try {
    await updateStoreWeeklyHours(normalizeWeeklyMenuHours(rawWeeklyHours));
    revalidatePath("/");
    revalidatePath("/staff");

    return {
      success: true,
      message: "All Day menu hours updated.",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to update all day menu hours.",
    };
  }
}
