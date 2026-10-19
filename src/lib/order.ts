import { isMenuItemOrderableAt, type OrderingAvailability } from "@/lib/menu-availability";
import { prisma } from "@/lib/prisma";
import { queueNewOrderPrintJob } from "@/lib/print-jobs";

export const SALES_TAX_BPS = 0;

export type CreateOrderInput = {
  customerName?: string;
  phone: string;
  requestedPickupAt?: string;
  notes?: string;
  items: CreateOrderItemInput[];
};

export type CreateOrderItemInput = {
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  selectedOptionIds: string[];
};

export type CalculatedOrderLine = {
  menuItemId: string;
  quantity: number;
  itemNameSnapshot: string;
  unitPriceCents: number;
  lineTotalCents: number;
  specialInstructions?: string;
  selectedOptions: {
    modifierOptionId: string;
    optionNameSnapshot: string;
    priceDeltaCents: number;
  }[];
};

export type CalculatedOrder = {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  lines: CalculatedOrderLine[];
};

function normalizeOptionalText(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function roundUpToQuarterHour(date: Date) {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);

  const remainder = rounded.getMinutes() % 15;
  if (remainder !== 0) {
    rounded.setMinutes(rounded.getMinutes() + (15 - remainder));
  }

  return rounded;
}

function normalizeRequestedPickupAt(value?: string): Date | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error("Choose a valid pickup time.");
  }

  const normalized = new Date(parsed);
  normalized.setSeconds(0, 0);

  const now = new Date();
  const earliestAllowed = roundUpToQuarterHour(new Date(now.getTime() + 15 * 60 * 1000));
  const latestAllowed = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (normalized.getMinutes() % 15 !== 0) {
    throw new Error("Pickup time must be in 15-minute increments.");
  }

  if (normalized.getTime() < earliestAllowed.getTime()) {
    throw new Error("Pickup time must be at least 15 minutes from now.");
  }

  if (normalized.getTime() > latestAllowed.getTime()) {
    throw new Error("Pickup time must be within the next 7 days.");
  }

  return normalized;
}

function getCategoryAvailability(category: OrderingAvailability) {
  return {
    manualOrderingOpen: category.manualOrderingOpen,
    availableFromHour: category.availableFromHour,
    availableUntilHour: category.availableUntilHour,
  } satisfies OrderingAvailability;
}

export async function getNextOrderNumber(): Promise<number> {
  const latestOrder = await prisma.order.findFirst({
    orderBy: {
      orderNumber: "desc",
    },
    select: {
      orderNumber: true,
    },
  });

  return (latestOrder?.orderNumber ?? 1000) + 1;
}

export async function calculateOrder(input: CreateOrderInput): Promise<CalculatedOrder> {
  const uniqueMenuItemIds = [...new Set(input.items.map((item) => item.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: {
        in: uniqueMenuItemIds,
      },
      isAvailable: true,
      manualOrderingOpen: true,
      category: {
        isActive: true,
      },
    },
    include: {
      category: true,
      modifierGroups: {
        include: {
          options: true,
        },
      },
    },
  });

  const menuById = new Map(menuItems.map((item) => [item.id, item]));

  const lines = input.items.map((item) => {
    if (item.quantity < 1) {
      throw new Error("Each order item must have a quantity of at least 1.");
    }

    const menuItem = menuById.get(item.menuItemId);
    if (!menuItem) {
      throw new Error("One or more selected menu items are unavailable.");
    }

    if (!isMenuItemOrderableAt(getCategoryAvailability(menuItem.category), menuItem.manualOrderingOpen)) {
      throw new Error(`${menuItem.name} is not available for ordering right now.`);
    }

    const selectedOptionIds = [...new Set(item.selectedOptionIds)];
    const optionLookup = new Map(
      menuItem.modifierGroups.flatMap((group) =>
        group.options.map((option) => [
          option.id,
          {
            option,
            group,
          },
        ]),
      ),
    );

    const selectionsByGroup = new Map<string, typeof selectedOptionIds>();
    const selectedOptions = selectedOptionIds.map((optionId) => {
      const match = optionLookup.get(optionId);
      if (!match) {
        throw new Error(`Invalid modifier selection for ${menuItem.name}.`);
      }

      if (!match.option.isAvailable) {
        throw new Error(`A selected modifier is no longer available for ${menuItem.name}.`);
      }

      const existing = selectionsByGroup.get(match.group.id) ?? [];
      selectionsByGroup.set(match.group.id, [...existing, optionId]);

      return {
        modifierOptionId: match.option.id,
        optionNameSnapshot: match.option.name,
        priceDeltaCents: match.option.priceDeltaCents,
      };
    });

    for (const group of menuItem.modifierGroups) {
      const selectedCount = selectionsByGroup.get(group.id)?.length ?? 0;

      if (group.isRequired && selectedCount < group.minSelect) {
        throw new Error(`${menuItem.name} requires selections for ${group.name}.`);
      }

      if (selectedCount < group.minSelect || selectedCount > group.maxSelect) {
        throw new Error(`${menuItem.name} has an invalid number of selections for ${group.name}.`);
      }
    }

    const optionDeltaCents = selectedOptions.reduce(
      (sum, option) => sum + option.priceDeltaCents,
      0,
    );
    const unitPriceCents = menuItem.priceCents + optionDeltaCents;
    const lineTotalCents = unitPriceCents * item.quantity;

    return {
      menuItemId: menuItem.id,
      quantity: item.quantity,
      itemNameSnapshot: menuItem.name,
      unitPriceCents,
      lineTotalCents,
      specialInstructions: normalizeOptionalText(item.specialInstructions),
      selectedOptions,
    } satisfies CalculatedOrderLine;
  });

  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  const taxCents = Math.round((subtotalCents * SALES_TAX_BPS) / 10_000);
  const totalCents = subtotalCents + taxCents;

  return {
    subtotalCents,
    taxCents,
    totalCents,
    lines,
  };
}

export async function createOrder(input: CreateOrderInput) {
  const orderNumber = await getNextOrderNumber();
  const calculated = await calculateOrder(input);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      status: "CONFIRMED",
      customerName: normalizeOptionalText(input.customerName),
      phone: input.phone.trim(),
      notes: normalizeOptionalText(input.notes),
      requestedPickupAt: normalizeRequestedPickupAt(input.requestedPickupAt),
      subtotalCents: calculated.subtotalCents,
      taxCents: calculated.taxCents,
      totalCents: calculated.totalCents,
      orderItems: {
        create: calculated.lines.map((line) => ({
          menuItem: {
            connect: {
              id: line.menuItemId,
            },
          },
          quantity: line.quantity,
          itemNameSnapshot: line.itemNameSnapshot,
          unitPriceCents: line.unitPriceCents,
          lineTotalCents: line.lineTotalCents,
          specialInstructions: line.specialInstructions,
          modifiers: {
            create: line.selectedOptions,
          },
        })),
      },
    },
    include: {
      orderItems: {
        include: {
          modifiers: true,
        },
      },
    },
  });

  await queueNewOrderPrintJob(order.id);

  return order;
}
