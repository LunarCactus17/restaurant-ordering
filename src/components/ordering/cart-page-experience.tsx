"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { useCart } from "@/components/ordering/cart-provider";
import { submitOrderAction } from "@/app/actions";
import { formatCurrency, formatEstimatedReadyTime, formatPhoneForDisplay } from "@/lib/format";
import type { CheckoutFieldErrors, OrderConfirmation } from "@/lib/types";

function getItemUnitPrice(item: {
  basePriceCents: number;
  quantity: number;
  selectedOptions: { priceDeltaCents: number }[];
}) {
  return item.basePriceCents + item.selectedOptions.reduce((sum, option) => sum + option.priceDeltaCents, 0);
}

function getItemLineTotal(item: {
  basePriceCents: number;
  quantity: number;
  selectedOptions: { priceDeltaCents: number }[];
}) {
  return getItemUnitPrice(item) * item.quantity;
}

function toDateTimeLocalValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getEarliestPickupTime(estimatedPickupMinutes: number) {
  const date = new Date();
  date.setSeconds(0, 0);
  date.setMinutes(date.getMinutes() + Math.max(15, estimatedPickupMinutes));

  const remainder = date.getMinutes() % 15;
  if (remainder !== 0) {
    date.setMinutes(date.getMinutes() + (15 - remainder));
  }

  return date;
}

function getDefaultPickupTimeValue(estimatedPickupMinutes: number) {
  return toDateTimeLocalValue(getEarliestPickupTime(estimatedPickupMinutes));
}

function formatPickupTimeForDisplay(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type CartPageExperienceProps = {
  estimatedPickupMinutes: number;
};

export function CartPageExperience({ estimatedPickupMinutes }: CartPageExperienceProps) {
  const { cart, updateQuantity, removeItem, clearCart } = useCart();
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutName, setCheckoutName] = useState("");
  const [checkoutPickupTime, setCheckoutPickupTime] = useState(
    getDefaultPickupTimeValue(estimatedPickupMinutes),
  );
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [checkoutFieldErrors, setCheckoutFieldErrors] = useState<CheckoutFieldErrors>({});
  const [confirmation, setConfirmation] = useState<OrderConfirmation | null>(null);
  const [isPending, startTransition] = useTransition();

  const cartSubtotal = useMemo(
    () => cart.reduce((sum, item) => sum + getItemLineTotal(item), 0),
    [cart],
  );

  const clearCheckoutFeedback = () => {
    setCheckoutMessage(null);
    setCheckoutFieldErrors({});
  };

  const submitOrder = () => {
    clearCheckoutFeedback();

    startTransition(async () => {
      const result = await submitOrderAction({
        customerName: checkoutName,
        phone: checkoutPhone,
        requestedPickupAt: checkoutPickupTime,
        notes: checkoutNotes,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions,
          selectedOptionIds: item.selectedOptions.map((option) => option.optionId),
        })),
      });

      if (!result.success || !result.confirmation) {
        setCheckoutFieldErrors(result.fieldErrors ?? {});
        setCheckoutMessage(
          result.fieldErrors?.items && result.message === result.fieldErrors.items
            ? null
            : (result.message ?? "Unable to submit your order."),
        );
        return;
      }

      setConfirmation(result.confirmation);
      clearCart();
      setCheckoutPhone("");
      setCheckoutName("");
      setCheckoutPickupTime(getDefaultPickupTimeValue(estimatedPickupMinutes));
      setCheckoutNotes("");
      clearCheckoutFeedback();
    });
  };

  if (confirmation) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Order placed</p>
        <h1 className="mt-3 text-3xl font-semibold text-emerald-950">Order #{confirmation.orderNumber}</h1>
        <p className="mt-3 text-sm leading-6 text-emerald-900">
          We do not take online payment. Please pay in store when you pick up your food.
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Bring order #{confirmation.orderNumber} and phone {formatPhoneForDisplay(confirmation.phone)} when you arrive.
        </p>
        <p className="mt-2 text-sm leading-6 text-emerald-900">
          Requested pickup time: {confirmation.requestedPickupAt ? formatPickupTimeForDisplay(new Date(confirmation.requestedPickupAt)) : "ASAP"}
        </p>
        <div className="mt-6 space-y-3 text-sm text-emerald-900">
          {confirmation.items.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold">{item.name} ×{item.quantity}</span>
                <span>{formatCurrency(item.lineTotalCents)}</span>
              </div>
              {item.modifiers.length > 0 ? (
                <p className="mt-1 text-xs text-emerald-800">{item.modifiers.join(", ")}</p>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-emerald-200 pt-4 text-sm font-semibold text-emerald-950">
          <span>Total due at pickup</span>
          <span>{formatCurrency(confirmation.totalCents)}</span>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#d9f4d7] px-5 text-sm font-semibold text-[#245c2c] transition hover:bg-[#c5ebc2]"
          >
            Back to menu
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.58fr_0.42fr]">
      <section className="space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Cart page</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">Review your pickup order</h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                This page shows everything the customer ordered, the total due at pickup, and the phone number form before placing the order.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-100 px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-200"
            >
              Back to menu
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Order summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">What customer ordered</h2>
            </div>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
              {cart.length} line{cart.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Cart is empty. Go back to the menu page and add items first.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{item.menuItemName}</p>
                      {item.selectedOptions.length > 0 ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {item.selectedOptions.map((option) => option.optionName).join(", ")}
                        </p>
                      ) : null}
                      {item.specialInstructions ? (
                        <p className="mt-1 text-xs text-slate-500">Note: {item.specialInstructions}</p>
                      ) : null}
                    </div>
                    <span className="font-semibold text-slate-900">{formatCurrency(getItemLineTotal(item))}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:bg-white"
                      >
                        −
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-lg font-semibold text-slate-700 transition hover:bg-white"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-sm font-semibold text-rose-600 transition hover:text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <aside className="space-y-6 xl:sticky xl:top-6 xl:self-start">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Total</p>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(cartSubtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 text-sm text-slate-600">
              <span>Tax</span>
              <span className="font-semibold text-slate-900">Calculated on submit</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-950">
              <span>Total due at pickup</span>
              <span>{formatCurrency(cartSubtotal)}</span>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            We do not accept online payment. Customer pays in store at pickup after giving the order number and phone number.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Estimated ready in {formatEstimatedReadyTime(estimatedPickupMinutes)}.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Place order</p>
          <div className="mt-5 space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Phone number *</span>
              <input
                value={checkoutPhone}
                onChange={(event) => {
                  setCheckoutPhone(event.target.value);
                  setCheckoutFieldErrors((current) => ({ ...current, phone: undefined }));
                }}
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={checkoutFieldErrors.phone ? true : undefined}
                aria-describedby={checkoutFieldErrors.phone ? "cart-phone-error" : undefined}
                className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
                placeholder="(555) 123-4567"
              />
              {checkoutFieldErrors.phone ? (
                <p id="cart-phone-error" className="text-sm text-rose-600">{checkoutFieldErrors.phone}</p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Customer name (optional)</span>
              <input
                value={checkoutName}
                onChange={(event) => {
                  setCheckoutName(event.target.value);
                  setCheckoutFieldErrors((current) => ({ ...current, customerName: undefined }));
                }}
                autoComplete="name"
                className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
                placeholder="Alex"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Requested pickup time</span>
              <input
                type="datetime-local"
                value={checkoutPickupTime}
                min={getDefaultPickupTimeValue(estimatedPickupMinutes)}
                step={900}
                onChange={(event) => {
                  setCheckoutPickupTime(event.target.value);
                  setCheckoutFieldErrors((current) => ({ ...current, requestedPickupAt: undefined }));
                }}
                className="h-12 w-full rounded-2xl border border-slate-300 px-4 text-sm outline-none transition focus:border-slate-950"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Pickup note (optional)</span>
              <textarea
                value={checkoutNotes}
                onChange={(event) => {
                  setCheckoutNotes(event.target.value);
                  setCheckoutFieldErrors((current) => ({ ...current, notes: undefined }));
                }}
                className="min-h-24 w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-950"
                placeholder="Anything the kitchen or counter should know"
              />
            </label>

            {checkoutFieldErrors.items ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {checkoutFieldErrors.items}
              </div>
            ) : null}

            {checkoutMessage ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {checkoutMessage}
              </div>
            ) : null}

            <button
              type="button"
              disabled={isPending || cart.length === 0}
              onClick={submitOrder}
              className="inline-flex h-12 w-full items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Placing order..." : "Place order"}
            </button>
          </div>
        </section>
      </aside>
    </div>
  );
}
