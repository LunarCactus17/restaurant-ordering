import { createAllDayHours, parseWeeklyHoursJson, stringifyWeeklyHours } from "@/lib/menu-hours";
import { prisma } from "@/lib/prisma";
import type { StoreSettings } from "@/lib/types";

const DEFAULT_ESTIMATED_PICKUP_MINUTES = 30;
const DEFAULT_WEEKLY_HOURS = createAllDayHours();

export async function getStoreSettings(): Promise<StoreSettings> {
  const settings = await prisma.storeSettings.findFirst({
    orderBy: {
      createdAt: "asc",
    },
  });

  return {
    estimatedPickupMinutes: settings?.estimatedPickupMinutes ?? DEFAULT_ESTIMATED_PICKUP_MINUTES,
    weeklyHours: parseWeeklyHoursJson(settings?.weeklyHoursJson, DEFAULT_WEEKLY_HOURS),
  };
}

export async function updateEstimatedPickupMinutes(estimatedPickupMinutes: number) {
  const existing = await prisma.storeSettings.findFirst({
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (existing) {
    return prisma.storeSettings.update({
      where: {
        id: existing.id,
      },
      data: {
        estimatedPickupMinutes,
      },
    });
  }

  return prisma.storeSettings.create({
    data: {
      estimatedPickupMinutes,
      weeklyHoursJson: stringifyWeeklyHours(DEFAULT_WEEKLY_HOURS),
    },
  });
}

export async function updateStoreWeeklyHours(weeklyHours: StoreSettings["weeklyHours"]) {
  const existing = await prisma.storeSettings.findFirst({
    select: {
      id: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const weeklyHoursJson = stringifyWeeklyHours(weeklyHours);

  if (existing) {
    return prisma.storeSettings.update({
      where: {
        id: existing.id,
      },
      data: {
        weeklyHoursJson,
      },
    });
  }

  return prisma.storeSettings.create({
    data: {
      estimatedPickupMinutes: DEFAULT_ESTIMATED_PICKUP_MINUTES,
      weeklyHoursJson,
    },
  });
}
