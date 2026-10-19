"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useCart } from "@/components/ordering/cart-provider";
import { formatCurrency } from "@/lib/format";
import type { MenuCategory, MenuItem } from "@/lib/types";

function getCartItemCount(itemCount: number[], fallback = 0) {
  return itemCount.reduce((sum, quantity) => sum + quantity, fallback);
}

type OrderingExperienceProps = {
  categories: MenuCategory[];
  estimatedPickupMinutes: number;
};

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="9" cy="20" r="1.25" />
      <circle cx="18" cy="20" r="1.25" />
      <path d="M3 4h2.2l2.1 9.1a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H7.1" />
    </svg>
  );
}

function FloatingCartButton({ cartItemCount }: { cartItemCount: number }) {
  return (
    <Link
      href="/cart"
      aria-label={`View cart with ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}`}
      className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-full bg-[#d84b4b] px-5 py-4 text-white shadow-[0_16px_40px_rgba(216,75,75,0.28)] transition hover:bg-[#c83d3d] sm:bottom-6 sm:right-6 sm:px-6"
    >
      <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/16">
        <ShoppingCartIcon className="h-6 w-6" />
        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#ffd27a] px-1 text-[11px] font-bold leading-none text-[#5c2f06]">
          {cartItemCount}
        </span>
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold uppercase tracking-[0.16em] text-white/80">Cart</span>
        <span className="text-base font-semibold">View order</span>
      </span>
    </Link>
  );
}

export function OrderingExperience({ categories }: OrderingExperienceProps) {
  const { cart, addItem } = useCart();
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [activeMenuView, setActiveMenuView] = useState<"ALL_DAY" | "LUNCH">("ALL_DAY");

  const cartItemCount = useMemo(() => getCartItemCount(cart.map((item) => item.quantity)), [cart]);

  const visibleCategories = useMemo(
    () => categories.filter((category) => (category.menuGroup ?? "ALL_DAY") === activeMenuView),
    [activeMenuView, categories],
  );

  const openCustomizer = (item: MenuItem) => {
    setActiveItem(item);
    setSelectedOptionIds([]);
    setSpecialInstructions("");
    setSelectedQuantity(1);
    setCartMessage(null);
  };

  const closeCustomizer = () => {
    setActiveItem(null);
    setSelectedOptionIds([]);
    setSpecialInstructions("");
    setSelectedQuantity(1);
  };

  const toggleOption = (menuItem: MenuItem, groupId: string, optionId: string) => {
    const group = menuItem.modifierGroups.find((entry) => entry.id === groupId);
    if (!group) {
      return;
    }

    setSelectedOptionIds((current) => {
      const groupOptionIds = new Set(group.options.map((option) => option.id));
      const currentlySelectedInGroup = current.filter((id) => groupOptionIds.has(id));
      const isSelected = current.includes(optionId);

      if (group.maxSelect === 1) {
        if (isSelected) {
          return current.filter((id) => id !== optionId);
        }

        return [...current.filter((id) => !groupOptionIds.has(id)), optionId];
      }

      if (isSelected) {
        return current.filter((id) => id !== optionId);
      }

      if (currentlySelectedInGroup.length >= group.maxSelect) {
        return current;
      }

      return [...current, optionId];
    });
  };

  const addActiveItemToCart = () => {
    if (!activeItem) {
      return;
    }

    for (const group of activeItem.modifierGroups) {
      const selectedCount = selectedOptionIds.filter((optionId) => group.options.some((option) => option.id === optionId)).length;

      if (selectedCount < group.minSelect || selectedCount > group.maxSelect) {
        setCartMessage(`Please complete ${group.name} for ${activeItem.name}.`);
        return;
      }
    }

    const selectedOptions = activeItem.modifierGroups.flatMap((group) =>
      group.options
        .filter((option) => selectedOptionIds.includes(option.id))
        .map((option) => ({
          modifierGroupId: group.id,
          modifierGroupName: group.name,
          optionId: option.id,
          optionName: option.name,
          priceDeltaCents: option.priceDeltaCents,
        })),
    );

    addItem({
      menuItemId: activeItem.id,
      menuItemName: activeItem.name,
      quantity: selectedQuantity,
      basePriceCents: activeItem.priceCents,
      specialInstructions: specialInstructions.trim() || undefined,
      selectedOptions,
    });

    setCartMessage(`${activeItem.name} added to cart.`);
    closeCustomizer();
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-[#e8d8c2] bg-[#fffaf4] p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a1662f]">Our menu</p>
            <p className="mt-1 text-sm text-[#75523a]">Choose your dishes below, then review your order in cart before checkout.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span suppressHydrationWarning className="inline-flex h-10 items-center gap-2 rounded-full bg-[#f6d7ab] px-4 text-sm font-semibold text-[#7b4a1e]">
              <ShoppingCartIcon className="h-4 w-4" />
              {cartItemCount} item{cartItemCount === 1 ? "" : "s"} in cart
            </span>
            <Link
              href="/cart"
              aria-label={`View cart with ${cartItemCount} item${cartItemCount === 1 ? "" : "s"}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#d84b4b] text-white shadow-sm transition hover:bg-[#c83d3d]"
            >
              <ShoppingCartIcon className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="inline-flex w-fit rounded-full border border-[#ead9c5] bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveMenuView("ALL_DAY")}
              className={`rounded-full px-5 py-3 text-base font-semibold transition sm:text-lg ${activeMenuView === "ALL_DAY" ? "bg-[#2f1d14] text-white" : "text-[#6d4c38] hover:bg-[#f8efe3]"}`}
            >
              All Day
            </button>
            <button
              type="button"
              onClick={() => setActiveMenuView("LUNCH")}
              className={`rounded-full px-5 py-3 text-base font-semibold transition sm:text-lg ${activeMenuView === "LUNCH" ? "bg-[#2f1d14] text-white" : "text-[#6d4c38] hover:bg-[#f8efe3]"}`}
            >
              Lunch
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {visibleCategories.map((category) => (
              <a
                key={`${category.id}-nav`}
                href={`#${category.slug}`}
                className="inline-flex items-center rounded-full border border-[#ead9c5] bg-white px-3 py-2 text-sm font-medium text-[#5f4331] transition hover:bg-[#f8efe3]"
              >
                {category.name}
              </a>
            ))}
          </div>
        </div>

        {visibleCategories.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-[#ead9c5] bg-white px-4 py-3 text-sm text-[#75523a]">
            No categories are available in this menu right now.
          </div>
        ) : null}

        {cartMessage ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{cartMessage}</div> : null}
      </section>

      <div className="space-y-6">
        {visibleCategories.map((category) => (
          <section key={category.id} id={category.slug} className="scroll-mt-24 rounded-[2rem] border border-[#e8d8c2] bg-[#fffaf4] p-6 shadow-sm">
            <div className="mb-6 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-semibold text-[#3b261b]">{category.name}</h3>
                {!category.isCurrentlyOrderable ? (
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    Currently unavailable
                  </span>
                ) : null}
              </div>
              {category.description ? <p className="text-sm leading-6 text-[#75523a]">{category.description}</p> : null}
              {category.availabilityNote ? (
                <p className="inline-flex rounded-full bg-[#f7e1b8] px-3 py-1 text-xs font-semibold text-[#8a581f]">
                  {category.availabilityNote}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {category.items.map((item) => (
                <article key={item.id} className={`rounded-[1.5rem] border border-[#ecdcc8] bg-white p-5 shadow-[0_6px_18px_rgba(59,38,27,0.04)] ${!category.isCurrentlyOrderable ? "opacity-80" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-[#3b261b]">{item.name}</h4>
                      {item.description ? <p className="text-sm leading-6 text-[#7a5944]">{item.description}</p> : null}
                    </div>
                    <span className="rounded-full bg-[#f7e1b8] px-3 py-1 text-sm font-semibold text-[#8a581f]">{formatCurrency(item.priceCents)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCustomizer(item)}
                    aria-label={`Add ${item.name}`}
                    disabled={!category.isCurrentlyOrderable}
                    className={`mt-5 inline-flex h-11 w-11 items-center justify-center rounded-full text-2xl font-semibold text-white transition ${category.isCurrentlyOrderable ? "bg-[#2f1d14] hover:bg-[#4a2f21]" : "cursor-not-allowed bg-slate-300"}`}
                  >
                    +
                  </button>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <FloatingCartButton cartItemCount={cartItemCount} />

      {activeItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Customize item</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{activeItem.name}</h3>
                {activeItem.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{activeItem.description}</p> : null}
              </div>
              <button type="button" onClick={closeCustomizer} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">×</button>
            </div>

            <div className="mt-4 inline-flex rounded-full bg-orange-100 px-4 py-2 text-sm font-semibold text-orange-800">Base price {formatCurrency(activeItem.priceCents)}</div>

            <div className="mt-6 space-y-6">
              {activeItem.modifierGroups.map((group) => {
                const selectedCount = selectedOptionIds.filter((optionId) => group.options.some((option) => option.id === optionId)).length;

                return (
                  <section key={group.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-950">{group.name}</h4>
                        <p className="text-sm text-slate-500">
                          Select {group.minSelect}
                          {group.maxSelect !== group.minSelect ? `-${group.maxSelect}` : ""}
                          {group.maxSelect === 1 ? " option" : " options"}
                          {group.isRequired ? " • Required" : " • Optional"}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {selectedCount}/{group.maxSelect}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {group.options.map((option) => {
                        const checked = selectedOptionIds.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => toggleOption(activeItem, group.id, option.id)}
                            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${checked ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-900 hover:border-slate-300"}`}
                          >
                            <span>
                              <span className="block font-medium">{option.name}</span>
                              <span className={`block text-xs ${checked ? "text-slate-200" : "text-slate-500"}`}>
                                {option.priceDeltaCents > 0 ? `+${formatCurrency(option.priceDeltaCents)}` : "Included"}
                              </span>
                            </span>
                            <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs ${checked ? "border-white bg-white text-slate-950" : "border-slate-300 text-transparent"}`}>✓</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                );
              })}

              <section className="rounded-2xl border border-slate-200 p-4">
                <label htmlFor="special-instructions" className="text-sm font-semibold text-slate-900">Special instructions</label>
                <textarea
                  id="special-instructions"
                  value={specialInstructions}
                  onChange={(event) => setSpecialInstructions(event.target.value)}
                  maxLength={200}
                  rows={4}
                  placeholder="Add any requests for this item"
                  className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </section>

              <section className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Quantity</p>
                    <p className="text-xs text-slate-500">Adjust how many of this item you want.</p>
                  </div>
                  <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 px-3 py-2">
                    <button type="button" onClick={() => setSelectedQuantity((current) => Math.max(1, current - 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-900 transition hover:bg-slate-200">−</button>
                    <span className="min-w-6 text-center text-sm font-semibold text-slate-900">{selectedQuantity}</span>
                    <button type="button" onClick={() => setSelectedQuantity((current) => Math.min(20, current + 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-900 transition hover:bg-slate-200">+</button>
                  </div>
                </div>
              </section>
            </div>

            {cartMessage ? <p className="mt-4 text-sm text-rose-600">{cartMessage}</p> : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeCustomizer} className="inline-flex h-11 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">Cancel</button>
              <button type="button" onClick={addActiveItemToCart} className="inline-flex h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800">Add to cart</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
