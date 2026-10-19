import type { BusinessDayKey, DailyMenuHours, WeeklyMenuHours } from "@/lib/types";
import { formatMinutes } from "@/lib/menu-hours";

const BUSINESS_TIME_ZONE = "America/New_York";

export type OrderingAvailability = {
  manualOrderingOpen: boolean;
  availableFromHour: number | null;
  availableUntilHour: number | null;
  weeklyHours?: WeeklyMenuHours;
};

function getCurrentBusinessDayAndMinutes(date: Date) {
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: "long",
  });
  const hourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const timeParts = hourFormatter.format(date).split(":");
  const hours = Number(timeParts[0] ?? "0");
  const minutes = Number(timeParts[1] ?? "0");

  return {
    day: dayFormatter.format(date).toUpperCase() as BusinessDayKey,
    minutes: hours * 60 + minutes,
  };
}

function formatDayHours(dayHours: DailyMenuHours) {
  if (dayHours.isClosed || dayHours.openMinutes === null || dayHours.closeMinutes === null) {
    return "Closed";
  }

  return `${formatMinutes(dayHours.openMinutes)} to ${formatMinutes(dayHours.closeMinutes)}`;
}

function normalizeMinutes(totalMinutes: number) {
  return ((totalMinutes % 1440) + 1440) % 1440;
}

function isMinutesWithinRange(minutes: number, openMinutes: number | null, closeMinutes: number | null) {
  if (openMinutes === null || closeMinutes === null) {
    return false;
  }

  const current = normalizeMinutes(minutes);
  const start = normalizeMinutes(openMinutes);
  const end = normalizeMinutes(closeMinutes);

  if (start === end) {
    return true;
  }

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

function hasLegacySchedule(schedule: OrderingAvailability) {
  return schedule.availableFromHour !== null || schedule.availableUntilHour !== null;
}

function isLegacyScheduleOpen(schedule: OrderingAvailability, minutes: number) {
  if (!hasLegacySchedule(schedule)) {
    return true;
  }

  const startMinutes = schedule.availableFromHour !== null ? schedule.availableFromHour * 60 : null;
  const endMinutes = schedule.availableUntilHour !== null ? schedule.availableUntilHour * 60 : null;

  if (startMinutes !== null && endMinutes !== null) {
    return isMinutesWithinRange(minutes, startMinutes, endMinutes);
  }

  if (startMinutes !== null) {
    return normalizeMinutes(minutes) >= normalizeMinutes(startMinutes);
  }

  return normalizeMinutes(minutes) < normalizeMinutes(endMinutes ?? 24 * 60);
}

export function isCategoryVisibleForOrdering(schedule: OrderingAvailability, date = new Date()) {
  if (!schedule.manualOrderingOpen) {
    return false;
  }

  const { day, minutes } = getCurrentBusinessDayAndMinutes(date);

  if (schedule.weeklyHours) {
    const dayHours = schedule.weeklyHours[day];
    if (dayHours.isClosed || dayHours.openMinutes === null || dayHours.closeMinutes === null) {
      return false;
    }

    return isMinutesWithinRange(minutes, dayHours.openMinutes, dayHours.closeMinutes);
  }

  return isLegacyScheduleOpen(schedule, minutes);
}

export function getCategoryAvailabilityNote(schedule: OrderingAvailability, date = new Date()) {
  if (!schedule.manualOrderingOpen) {
    return "Temporarily closed by the store.";
  }

  const { day } = getCurrentBusinessDayAndMinutes(date);

  if (schedule.weeklyHours) {
    const dayHours = schedule.weeklyHours[day];
    const label = formatDayHours(dayHours);
    return isCategoryVisibleForOrdering(schedule, date)
      ? `Today's menu hour is ${label}. Ordering is open now.`
      : `Today's menu hour is ${label}.`;
  }

  if (!hasLegacySchedule(schedule)) {
    return undefined;
  }

  const startLabel = schedule.availableFromHour !== null ? formatMinutes(schedule.availableFromHour * 60) : undefined;
  const endLabel = schedule.availableUntilHour !== null ? formatMinutes(schedule.availableUntilHour * 60) : undefined;

  if (isCategoryVisibleForOrdering(schedule, date)) {
    if (startLabel && endLabel) {
      return `Available daily from ${startLabel} to ${endLabel}. Ordering is open now.`;
    }

    if (startLabel) {
      return `Available daily starting at ${startLabel}. Ordering is open now.`;
    }

    return `Available daily until ${endLabel}. Ordering is open now.`;
  }

  if (startLabel && endLabel) {
    return `Available daily from ${startLabel} to ${endLabel}.`;
  }

  if (startLabel) {
    return `Available daily starting at ${startLabel}.`;
  }

  return `Available daily until ${endLabel}.`;
}

export function isMenuItemOrderableAt(schedule: OrderingAvailability, itemManualOrderingOpen: boolean, date = new Date()) {
  return itemManualOrderingOpen && isCategoryVisibleForOrdering(schedule, date);
}
