import { prisma } from "@/lib/prisma";
import type { OrderStatus, StaffOrder } from "@/lib/types";

const ACTIVE_ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

export async function getActiveStaffOrders(): Promise<StaffOrder[]> {
  return prisma.order.findMany({
    where: {
      status: {
        in: ACTIVE_ORDER_STATUSES,
      },
    },
    orderBy: [
      {
        requestedPickupAt: "asc",
      },
      {
        createdAt: "asc",
      },
      {
        orderNumber: "asc",
      },
    ],
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
}

export async function updateStaffOrderStatus(orderId: string, status: OrderStatus) {
  return prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      status,
    },
  });
}

export async function updateStaffPaymentReceived(orderId: string, paymentReceived: boolean) {
  return prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      paymentReceived,
    },
  });
}
