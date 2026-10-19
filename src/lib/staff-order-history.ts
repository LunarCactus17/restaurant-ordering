import { prisma } from "@/lib/prisma";
import type { StaffOrder, StaffOrderHistorySummary } from "@/lib/types";

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

export function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export async function getStaffOrderHistoryByDate(dateInput: string): Promise<{
  summary: StaffOrderHistorySummary;
  orders: StaffOrder[];
}> {
  const selectedDate = new Date(`${dateInput}T12:00:00`);

  if (Number.isNaN(selectedDate.getTime())) {
    throw new Error("Invalid history date.");
  }

  const rangeStart = startOfLocalDay(selectedDate);
  const rangeEnd = endOfLocalDay(selectedDate);

  const orders = await prisma.order.findMany({
    where: {
      createdAt: {
        gte: rangeStart,
        lte: rangeEnd,
      },
    },
    orderBy: [{ createdAt: "desc" }, { orderNumber: "desc" }],
    include: {
      orderItems: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          modifiers: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      },
    },
  });

  return {
    summary: {
      date: dateInput,
      orderCount: orders.length,
      totalSalesCents: orders.reduce((sum, order) => sum + order.totalCents, 0),
    },
    orders,
  };
}
