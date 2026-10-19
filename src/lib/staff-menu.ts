import {
  createDailyWindowHours,
  parseWeeklyHoursJson,
  stringifyWeeklyHours,
} from "@/lib/menu-hours";
import { prisma } from "@/lib/prisma";
import type { StaffMenuCategoryAvailability, WeeklyMenuHours } from "@/lib/types";

function getMenuGroup(availableFromHour: number | null, availableUntilHour: number | null) {
  const hasLunchWindow = availableFromHour !== null || availableUntilHour !== null;
  return hasLunchWindow ? "LUNCH" : "ALL_DAY";
}

export async function getStaffMenuAvailability(): Promise<StaffMenuCategoryAvailability[]> {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      manualOrderingOpen: true,
      availableFromHour: true,
      availableUntilHour: true,
      weeklyHoursJson: true,
      items: {
        where: {
          isAvailable: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        select: {
          id: true,
          name: true,
          priceCents: true,
          manualOrderingOpen: true,
          isAvailable: true,
        },
      },
    },
  });

  return categories.map((category) => ({
    ...category,
    weeklyHours: parseWeeklyHoursJson(
      category.weeklyHoursJson,
      category.availableFromHour !== null || category.availableUntilHour !== null
        ? createDailyWindowHours((category.availableFromHour ?? 11) * 60, (category.availableUntilHour ?? 15) * 60)
        : undefined,
    ),
    menuGroup: getMenuGroup(category.availableFromHour, category.availableUntilHour),
  }));
}

export async function updateCategoryManualOrderingOpen(categoryId: string, manualOrderingOpen: boolean) {
  return prisma.category.update({
    where: {
      id: categoryId,
    },
    data: {
      manualOrderingOpen,
    },
  });
}

export async function updateCategorySchedule(
  categoryId: string,
  availableFromHour: number | null,
  availableUntilHour: number | null,
) {
  return prisma.category.update({
    where: {
      id: categoryId,
    },
    data: {
      availableFromHour,
      availableUntilHour,
    },
  });
}

export async function updateCategoryDescription(categoryId: string, description: string | null) {
  return prisma.category.update({
    where: {
      id: categoryId,
    },
    data: {
      description,
    },
  });
}

export async function updateMenuItemManualOrderingOpen(menuItemId: string, manualOrderingOpen: boolean) {
  return prisma.menuItem.update({
    where: {
      id: menuItemId,
    },
    data: {
      manualOrderingOpen,
    },
  });
}

export async function updateCategoryWeeklyHours(categoryId: string, weeklyHours: WeeklyMenuHours) {
  return prisma.category.update({
    where: {
      id: categoryId,
    },
    data: {
      weeklyHoursJson: stringifyWeeklyHours(weeklyHours),
    },
  });
}
