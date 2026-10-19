import type { BusinessDayKey, DailyMenuHours, WeeklyMenuHours } from "@/lib/types";

export const BUSINESS_DAY_ORDER: BusinessDayKey[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export const BUSINESS_DAY_LABELS: Record<BusinessDayKey, string> = {
  SUNDAY: "Sunday",
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
};

export function createClosedDay(): DailyMenuHours {
  return {
    isClosed: true,
    openMinutes: null,
    closeMinutes: null,
  };
}

export function createAllDayHours(): WeeklyMenuHours {
  return {
    SUNDAY: { isClosed: false, openMinutes: 12 * 60, closeMinutes: 21 * 60 + 30 },
    MONDAY: { isClosed: false, openMinutes: 11 * 60, closeMinutes: 21 * 60 + 30 },
    TUESDAY: { isClosed: false, openMinutes: 11 * 60, closeMinutes: 21 * 60 + 30 },
    WEDNESDAY: createClosedDay(),
    THURSDAY: { isClosed: false, openMinutes: 11 * 60, closeMinutes: 21 * 60 + 30 },
    FRIDAY: { isClosed: false, openMinutes: 11 * 60, closeMinutes: 21 * 60 + 30 },
    SATURDAY: { isClosed: false, openMinutes: 12 * 60, closeMinutes: 21 * 60 + 30 },
  };
}

export function createDailyWindowHours(openMinutes: number, closeMinutes: number): WeeklyMenuHours {
  return {
    SUNDAY: createClosedDay(),
    MONDAY: { isClosed: false, openMinutes, closeMinutes },
    TUESDAY: { isClosed: false, openMinutes, closeMinutes },
    WEDNESDAY: { isClosed: false, openMinutes, closeMinutes },
    THURSDAY: { isClosed: false, openMinutes, closeMinutes },
    FRIDAY: { isClosed: false, openMinutes, closeMinutes },
    SATURDAY: { isClosed: false, openMinutes, closeMinutes },
  };
}

export function cloneWeeklyHours(hours: WeeklyMenuHours): WeeklyMenuHours {
  return BUSINESS_DAY_ORDER.reduce<WeeklyMenuHours>((accumulator, dayKey) => {
    accumulator[dayKey] = { ...hours[dayKey] };
    return accumulator;
  }, {} as WeeklyMenuHours);
}

export function parseTimeInput(value: string): number | null {
  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error("Time must use HH:MM format.");
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || hours < 0 || hours > 23) {
    throw new Error("Hour must be between 00 and 23.");
  }

  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    throw new Error("Minutes must be between 00 and 59.");
  }

  return hours * 60 + minutes;
}

export function formatTimeInput(totalMinutes: number | null | undefined) {
  if (totalMinutes == null) {
    return "";
  }

  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function normalizeDailyMenuHours(input: Partial<DailyMenuHours> | null | undefined): DailyMenuHours {
  const isClosed = input?.isClosed ?? false;
  const openMinutes = input?.openMinutes ?? null;
  const closeMinutes = input?.closeMinutes ?? null;

  if (isClosed) {
    return createClosedDay();
  }

  if (openMinutes === null || closeMinutes === null) {
    return createClosedDay();
  }

  if (!Number.isInteger(openMinutes) || openMinutes < 0 || openMinutes > 1439) {
    throw new Error("Open time must be between 00:00 and 23:59.");
  }

  if (!Number.isInteger(closeMinutes) || closeMinutes < 0 || closeMinutes > 1439) {
    throw new Error("Close time must be between 00:00 and 23:59.");
  }

  return {
    isClosed: false,
    openMinutes,
    closeMinutes,
  };
}

export function normalizeWeeklyMenuHours(input: unknown, fallback?: WeeklyMenuHours): WeeklyMenuHours {
  const base = fallback ? cloneWeeklyHours(fallback) : createAllDayHours();

  if (!input || typeof input !== "object") {
    return base;
  }

  const record = input as Partial<Record<BusinessDayKey, Partial<DailyMenuHours>>>;

  return BUSINESS_DAY_ORDER.reduce<WeeklyMenuHours>((accumulator, dayKey) => {
    accumulator[dayKey] = normalizeDailyMenuHours(record[dayKey] ?? base[dayKey]);
    return accumulator;
  }, {} as WeeklyMenuHours);
}

export function parseWeeklyHoursJson(rawJson: string | null | undefined, fallback?: WeeklyMenuHours) {
  if (!rawJson) {
    return fallback ? cloneWeeklyHours(fallback) : createAllDayHours();
  }

  try {
    return normalizeWeeklyMenuHours(JSON.parse(rawJson), fallback);
  } catch {
    return fallback ? cloneWeeklyHours(fallback) : createAllDayHours();
  }
}

export function stringifyWeeklyHours(hours: WeeklyMenuHours) {
  return JSON.stringify(normalizeWeeklyMenuHours(hours));
}

export function formatMinutes(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const displayHour = hour24 % 12 || 12;
  if (minutes === 0) {
    return `${displayHour}:00 ${suffix}`;
  }
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function formatDailyMenuHours(dayHours: DailyMenuHours) {
  if (dayHours.isClosed || dayHours.openMinutes === null || dayHours.closeMinutes === null) {
    return "Closed";
  }

  return `${formatMinutes(dayHours.openMinutes)}–${formatMinutes(dayHours.closeMinutes)}`;
}
