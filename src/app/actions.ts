"use server";

import { revalidatePath } from "next/cache";

import { checkoutSchema } from "@/lib/checkout";
import { createOrder } from "@/lib/order";
import type { CheckoutFieldErrors, OrderConfirmation } from "@/lib/types";

export type SubmitOrderResult = {
  success: boolean;
  message?: string;
  fieldErrors?: CheckoutFieldErrors;
  confirmation?: OrderConfirmation;
};

export async function submitOrderAction(rawInput: unknown): Promise<SubmitOrderResult> {
  const parsed = checkoutSchema.safeParse(rawInput);

  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;

    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Please review your order details.",
      fieldErrors: {
        phone: flattened.phone?.[0],
        customerName: flattened.customerName?.[0],
        requestedPickupAt: flattened.requestedPickupAt?.[0],
        notes: flattened.notes?.[0],
        items: flattened.items?.[0],
      },
    };
  }

  try {
    const order = await createOrder(parsed.data);

    revalidatePath("/");
    revalidatePath("/staff");

    return {
      success: true,
      confirmation: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        phone: order.phone,
        notes: order.notes,
        requestedPickupAt: order.requestedPickupAt,
        subtotalCents: order.subtotalCents,
        taxCents: order.taxCents,
        totalCents: order.totalCents,
        items: order.orderItems.map((item) => ({
          id: item.id,
          name: item.itemNameSnapshot,
          quantity: item.quantity,
          lineTotalCents: item.lineTotalCents,
          modifiers: item.modifiers.map((modifier) => modifier.optionNameSnapshot),
        })),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unable to submit your order.",
    };
  }
}
