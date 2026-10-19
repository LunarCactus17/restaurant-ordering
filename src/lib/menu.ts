import {
  getCategoryAvailabilityNote,
  isCategoryVisibleForOrdering,
  isMenuItemOrderableAt,
  type OrderingAvailability,
} from "@/lib/menu-availability";
import { createDailyWindowHours, parseWeeklyHoursJson } from "@/lib/menu-hours";
import { prisma } from "@/lib/prisma";
import type { MenuCategory } from "@/lib/types";

function getCategoryAvailability(category: OrderingAvailability) {
  return {
    manualOrderingOpen: category.manualOrderingOpen,
    availableFromHour: category.availableFromHour,
    availableUntilHour: category.availableUntilHour,
    weeklyHours: category.weeklyHours,
  } satisfies OrderingAvailability;
}

function getMenuGroup(category: { availableFromHour?: number | null; availableUntilHour?: number | null }): "ALL_DAY" | "LUNCH" {
  return category.availableFromHour !== null && category.availableFromHour !== undefined ? "LUNCH" : "ALL_DAY";
}

export async function getMenuCategories(): Promise<MenuCategory[]> {
  const categories = await prisma.category.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      items: {
        where: {
          isAvailable: true,
          manualOrderingOpen: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          modifierGroups: {
            orderBy: {
              sortOrder: "asc",
            },
            include: {
              options: {
                where: {
                  isAvailable: true,
                },
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      },
    },
  });

  return categories
    .map((category) => {
      const fallbackWeeklyHours =
        category.availableFromHour !== null || category.availableUntilHour !== null
          ? createDailyWindowHours((category.availableFromHour ?? 11) * 60, (category.availableUntilHour ?? 15) * 60)
          : undefined;

      const categoryWithHours = {
        ...category,
        menuGroup: getMenuGroup(category),
        weeklyHours: parseWeeklyHoursJson(category.weeklyHoursJson, fallbackWeeklyHours),
      };

      return {
        ...categoryWithHours,
        items: category.items.filter((item) => item.manualOrderingOpen),
        availabilityNote: getCategoryAvailabilityNote(getCategoryAvailability(categoryWithHours)),
        isCurrentlyOrderable: isCategoryVisibleForOrdering(getCategoryAvailability(categoryWithHours)),
      };
    })
    .filter((category) => category.items.length > 0)
    .filter((category) => category.manualOrderingOpen);
}

export async function getMenuItemById(menuItemId: string) {
  const menuItem = await prisma.menuItem.findFirst({
    where: {
      id: menuItemId,
      isAvailable: true,
      manualOrderingOpen: true,
      category: {
        isActive: true,
      },
    },
    include: {
      category: true,
      modifierGroups: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          options: {
            where: {
              isAvailable: true,
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },
    },
  });

  if (!menuItem) {
    return null;
  }

  const fallbackWeeklyHours =
    menuItem.category.availableFromHour !== null || menuItem.category.availableUntilHour !== null
      ? createDailyWindowHours((menuItem.category.availableFromHour ?? 11) * 60, (menuItem.category.availableUntilHour ?? 15) * 60)
      : undefined;

  const categoryWithWeeklyHours = {
    ...menuItem.category,
    weeklyHours: parseWeeklyHoursJson(menuItem.category.weeklyHoursJson, fallbackWeeklyHours),
  };

  if (!isMenuItemOrderableAt(getCategoryAvailability(categoryWithWeeklyHours), menuItem.manualOrderingOpen)) {
    return null;
  }

  return menuItem;
}
