import { z } from "zod";

const PICKUP_TIME_STEP_MINUTES = 15;
const MIN_PREP_MINUTES = 15;
const MAX_ADVANCE_DAYS = 7;

function parsePickupTime(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isQuarterHour(date: Date) {
  return date.getSeconds() === 0 && date.getMilliseconds() === 0 && date.getMinutes() % PICKUP_TIME_STEP_MINUTES === 0;
}

export const checkoutItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
  specialInstructions: z.string().max(250).optional(),
  selectedOptionIds: z.array(z.string().min(1)).max(20),
});

export const checkoutSchema = z.object({
  customerName: z.string().max(80).optional(),
  phone: z
    .string()
    .min(7, "Phone number is required.")
    .max(25, "Phone number is too long.")
    .refine((value) => /[0-9]{7,}/.test(value.replace(/\D/g, "")), {
      message: "Enter a valid phone number.",
    }),
  requestedPickupAt: z
    .string()
    .optional()
    .refine((value) => !value || parsePickupTime(value) !== null, {
      message: "Choose a valid pickup time.",
    })
    .refine((value) => {
      if (!value) {
        return true;
      }

      const parsed = parsePickupTime(value);
      if (!parsed) {
        return false;
      }

      return isQuarterHour(parsed);
    }, {
      message: "Pickup time must be in 15-minute increments.",
    })
    .refine((value) => {
      if (!value) {
        return true;
      }

      const parsed = parsePickupTime(value);
      if (!parsed) {
        return false;
      }

      const earliestAllowed = new Date(Date.now() + MIN_PREP_MINUTES * 60 * 1000);
      return parsed.getTime() >= earliestAllowed.getTime();
    }, {
      message: "Pickup time must be at least 15 minutes from now.",
    })
    .refine((value) => {
      if (!value) {
        return true;
      }

      const parsed = parsePickupTime(value);
      if (!parsed) {
        return false;
      }

      const latestAllowed = new Date(Date.now() + MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000);
      return parsed.getTime() <= latestAllowed.getTime();
    }, {
      message: "Pickup time must be within the next 7 days.",
    }),
  notes: z.string().max(300).optional(),
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
