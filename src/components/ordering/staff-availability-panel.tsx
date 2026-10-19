"use client";

import { useMemo, useState, useTransition } from "react";

import {
  updateCategoryAvailabilityAction,
  updateCategoryDescriptionAction,
  updateCategoryWeeklyHoursAction,
  updateMenuItemAvailabilityAction,
  updateStoreWeeklyHoursAction,
} from "@/app/staff/actions";
import {
  BUSINESS_DAY_LABELS,
  BUSINESS_DAY_ORDER,
  cloneWeeklyHours,
  formatDailyMenuHours,
  formatTimeInput,
  parseTimeInput,
} from "@/lib/menu-hours";
import { formatCurrency } from "@/lib/format";
import type { BusinessDayKey, StaffMenuCategoryAvailability, WeeklyMenuHours } from "@/lib/types";

type StaffAvailabilityPanelProps = {
  categories: StaffMenuCategoryAvailability[];
  storeWeeklyHours: WeeklyMenuHours;
};

type StaffMenuView = "ALL_DAY" | "LUNCH";

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
    </svg>
  );
}

function AvailabilitySwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (nextChecked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-8 w-16 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-9" : "translate-x-1"
        }`}
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function getCurrentBusinessParts(date = new Date()) {
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });

  const weekday = dayFormatter.format(date).toUpperCase() as BusinessDayKey;
  const [hourText = "0", minuteText = "0"] = timeFormatter.format(date).split(":");
  const minutes = Number(hourText) * 60 + Number(minuteText);

  return { weekday, minutes };
}

function normalizeMinutes(minutes: number) {
  return ((minutes % 1440) + 1440) % 1440;
}

function isMinutesWithinRange(minutes: number, openMinutes: number | null, closeMinutes: number | null) {
  if (openMinutes === null || closeMinutes === null) {
    return false;
  }

  const current = normalizeMinutes(minutes);
  const start = normalizeMinutes(openMinutes);
  const end = normalizeMinutes(closeMinutes);

  if (start === end) {
    return true;
  }

  if (start < end) {
    return current >= start && current < end;
  }

  return current >= start || current < end;
}

function getTodayHoursLabel(weeklyHours: WeeklyMenuHours) {
  const { weekday } = getCurrentBusinessParts();
  return `${BUSINESS_DAY_LABELS[weekday]}: ${formatDailyMenuHours(weeklyHours[weekday])}`;
}

function getCategoryLiveStatus(category: StaffMenuCategoryAvailability) {
  if (!category.manualOrderingOpen) {
    return {
      label: "Closed manually",
      tone: "bg-rose-100 text-rose-700",
      description: "This category is manually closed by the manager.",
    };
  }

  const hours = category.weeklyHours;
  if (!hours) {
    return {
      label: "Hours not set",
      tone: "bg-amber-100 text-amber-800",
      description: "No weekly menu hours are configured yet.",
    };
  }

  const { weekday, minutes } = getCurrentBusinessParts();
  const todayHours = hours[weekday];

  if (todayHours.isClosed || todayHours.openMinutes === null || todayHours.closeMinutes === null) {
    return {
      label: "Closed today",
      tone: "bg-amber-100 text-amber-800",
      description: `${BUSINESS_DAY_LABELS[weekday]} is marked closed for this menu.`,
    };
  }

  if (!isMinutesWithinRange(minutes, todayHours.openMinutes, todayHours.closeMinutes)) {
    return {
      label: "Closed by menu hour",
      tone: "bg-amber-100 text-amber-800",
      description: `Today this menu is available ${formatDailyMenuHours(todayHours)}.`,
    };
  }

  return {
    label: "Open now",
    tone: "bg-emerald-100 text-emerald-800",
    description: `Today this menu is available ${formatDailyMenuHours(todayHours)}.`,
  };
}

function getItemLiveStatus(category: StaffMenuCategoryAvailability, itemManualOrderingOpen: boolean) {
  if (!category.manualOrderingOpen) {
    return {
      label: "Closed by category",
      tone: "bg-slate-200 text-slate-700",
    };
  }

  if (!itemManualOrderingOpen) {
    return {
      label: "Closed manually",
      tone: "bg-rose-100 text-rose-700",
    };
  }

  const hours = category.weeklyHours;
  if (!hours) {
    return {
      label: "Hours not set",
      tone: "bg-amber-100 text-amber-800",
    };
  }

  const { weekday, minutes } = getCurrentBusinessParts();
  const todayHours = hours[weekday];

  if (todayHours.isClosed || todayHours.openMinutes === null || todayHours.closeMinutes === null) {
    return {
      label: "Closed today",
      tone: "bg-amber-100 text-amber-800",
    };
  }

  if (!isMinutesWithinRange(minutes, todayHours.openMinutes, todayHours.closeMinutes)) {
    return {
      label: "Waiting for menu hour",
      tone: "bg-amber-100 text-amber-800",
    };
  }

  return {
    label: "Open now",
    tone: "bg-emerald-100 text-emerald-800",
  };
}

function WeeklyHoursEditor({
  title,
  description,
  value,
  disabled,
  onChange,
  onSave,
  saveLabel,
}: {
  title: string;
  description: string;
  value: WeeklyMenuHours;
  disabled: boolean;
  onChange: (nextValue: WeeklyMenuHours) => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={onSave}
          className="inline-flex h-10 items-center justify-center self-start rounded-full border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saveLabel}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {BUSINESS_DAY_ORDER.map((dayKey) => {
          const dayHours = value[dayKey];

          return (
            <div
              key={dayKey}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 lg:grid-cols-[140px_110px_1fr_1fr_140px] lg:items-end"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{BUSINESS_DAY_LABELS[dayKey]}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDailyMenuHours(dayHours)}</p>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={dayHours.isClosed}
                  disabled={disabled}
                  onChange={(event) => {
                    const nextValue = cloneWeeklyHours(value);
                    nextValue[dayKey] = event.target.checked
                      ? { isClosed: true, openMinutes: null, closeMinutes: null }
                      : {
                          isClosed: false,
                          openMinutes: nextValue[dayKey].openMinutes ?? 11 * 60,
                          closeMinutes: nextValue[dayKey].closeMinutes ?? 21 * 60 + 30,
                        };
                    onChange(nextValue);
                  }}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Closed
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Open
                <input
                  type="time"
                  step={60}
                  value={formatTimeInput(dayHours.openMinutes)}
                  disabled={disabled || dayHours.isClosed}
                  onChange={(event) => {
                    const nextValue = cloneWeeklyHours(value);
                    nextValue[dayKey] = {
                      ...nextValue[dayKey],
                      isClosed: false,
                      openMinutes: parseTimeInput(event.target.value),
                    };
                    onChange(nextValue);
                  }}
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Close
                <input
                  type="time"
                  step={60}
                  value={formatTimeInput(dayHours.closeMinutes)}
                  disabled={disabled || dayHours.isClosed}
                  onChange={(event) => {
                    const nextValue = cloneWeeklyHours(value);
                    nextValue[dayKey] = {
                      ...nextValue[dayKey],
                      isClosed: false,
                      closeMinutes: parseTimeInput(event.target.value),
                    };
                    onChange(nextValue);
                  }}
                  className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"
                />
              </label>

              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
                {formatDailyMenuHours(dayHours)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StaffAvailabilityPanel({ categories, storeWeeklyHours }: StaffAvailabilityPanelProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeMenuView, setActiveMenuView] = useState<StaffMenuView>("ALL_DAY");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(categories.map((category) => [category.id, false])),
  );
  const [editingDescriptionCategoryId, setEditingDescriptionCategoryId] = useState<string | null>(null);
  const [descriptionForm, setDescriptionForm] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((category) => [category.id, category.description ?? ""])),
  );
  const [categoryWeeklyHoursForm, setCategoryWeeklyHoursForm] = useState<Record<string, WeeklyMenuHours>>(() =>
    Object.fromEntries(
      categories.map((category) => [category.id, cloneWeeklyHours(category.weeklyHours ?? storeWeeklyHours)]),
    ),
  );
  const [storeWeeklyHoursForm, setStoreWeeklyHoursForm] = useState<WeeklyMenuHours>(() =>
    cloneWeeklyHours(storeWeeklyHours),
  );

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.menuGroup === activeMenuView),
    [activeMenuView, categories],
  );

  const toggleCategoryExpanded = (categoryId: string) => {
    setExpandedCategories((current) => ({
      ...current,
      [categoryId]: !current[categoryId],
    }));
  };

  const toggleCategory = (categoryId: string, nextOpen: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateCategoryAvailabilityAction(categoryId, nextOpen);
      setMessage(result.message ?? (result.success ? "Category availability updated." : "Unable to update category."));
    });
  };

  const toggleItem = (menuItemId: string, nextOpen: boolean) => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateMenuItemAvailabilityAction(menuItemId, nextOpen);
      setMessage(result.message ?? (result.success ? "Item availability updated." : "Unable to update item."));
    });
  };

  const saveDescription = (categoryId: string) => {
    const description = descriptionForm[categoryId] ?? "";

    setMessage(null);
    startTransition(async () => {
      const result = await updateCategoryDescriptionAction(categoryId, description);
      setMessage(
        result.message ?? (result.success ? "Category description updated." : "Unable to update category description."),
      );

      if (result.success) {
        setEditingDescriptionCategoryId(null);
      }
    });
  };

  const saveCategoryWeeklyHours = (categoryId: string) => {
    const weeklyHours = categoryWeeklyHoursForm[categoryId];
    if (!weeklyHours) {
      setMessage("Unable to find menu hours for this category.");
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await updateCategoryWeeklyHoursAction(categoryId, weeklyHours);
      setMessage(result.message ?? (result.success ? "Menu hours updated." : "Unable to update menu hours."));
    });
  };

  const saveStoreWeeklyHours = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await updateStoreWeeklyHoursAction(storeWeeklyHoursForm);
      setMessage(result.message ?? (result.success ? "All Day menu hours updated." : "Unable to update all day menu hours."));
    });
  };

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Menu availability controls
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Open or close categories and edit weekly menu hours
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Managers can manually open or close categories and items, and also set menu hour for each day from Sunday to Saturday.
          </p>
        </div>
        {message ? <p className="text-sm text-slate-600">{message}</p> : null}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">Menu management view</h3>
            <p className="mt-1 text-sm text-slate-600">
              Switch between all-day menu and lunch menu. All Day menu hours also feed the public website Hours box.
            </p>
          </div>
          <div className="inline-flex rounded-full border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveMenuView("ALL_DAY")}
              className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                activeMenuView === "ALL_DAY" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              All Day menu
            </button>
            <button
              type="button"
              onClick={() => setActiveMenuView("LUNCH")}
              className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-sm font-semibold transition ${
                activeMenuView === "LUNCH" ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Lunch menu
            </button>
          </div>
        </div>
      </div>

      {activeMenuView === "ALL_DAY" ? (
        <WeeklyHoursEditor
          title="Menu hour for All Day menu"
          description={`These hours are shown on the customer website Hours box. Today: ${getTodayHoursLabel(storeWeeklyHoursForm)}`}
          value={storeWeeklyHoursForm}
          disabled={isPending}
          onChange={setStoreWeeklyHoursForm}
          onSave={saveStoreWeeklyHours}
          saveLabel="Save All Day menu hour"
        />
      ) : null}

      <div className="mt-6 space-y-4">
        {visibleCategories.map((category) => {
          const categoryStatus = getCategoryLiveStatus(category);
          const isExpanded = expandedCategories[category.id] ?? true;
          const hoursForm = categoryWeeklyHoursForm[category.id] ?? cloneWeeklyHours(storeWeeklyHoursForm);

          return (
            <article key={category.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-semibold text-slate-950">{category.name}</h3>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                      <span className={`text-xs font-semibold ${category.manualOrderingOpen ? "text-emerald-800" : "text-rose-700"}`}>
                        {category.manualOrderingOpen ? "Open" : "Closed"}
                      </span>
                      <AvailabilitySwitch
                        checked={category.manualOrderingOpen}
                        disabled={isPending}
                        onChange={(nextOpen) => toggleCategory(category.id, nextOpen)}
                        label={`${category.manualOrderingOpen ? "Close" : "Open"} ${category.name} category`}
                      />
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryStatus.tone}`}>
                      {categoryStatus.label}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {category.menuGroup === "ALL_DAY" ? "All Day" : "Lunch"}
                    </span>
                    <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                      {getTodayHoursLabel(hoursForm)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {category.items.length} item{category.items.length === 1 ? "" : "s"}
                  </p>
                  {editingDescriptionCategoryId === category.id ? (
                    <div className="mt-3 space-y-2">
                      <label className="block text-xs font-medium text-slate-600" htmlFor={`description-${category.id}`}>
                        Category description
                      </label>
                      <textarea
                        id={`description-${category.id}`}
                        value={descriptionForm[category.id] ?? ""}
                        disabled={isPending}
                        onChange={(event) =>
                          setDescriptionForm((current) => ({
                            ...current,
                            [category.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        maxLength={200}
                        className="w-full max-w-2xl rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => saveDescription(category.id)}
                          className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Save description
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => {
                            setDescriptionForm((current) => ({
                              ...current,
                              [category.id]: category.description ?? "",
                            }));
                            setEditingDescriptionCategoryId(null);
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : category.description ? (
                    <p className="mt-2 text-sm leading-6 text-slate-600">{category.description}</p>
                  ) : (
                    <p className="mt-2 text-sm italic text-slate-400">No category description yet.</p>
                  )}
                  <p className="mt-1 text-xs leading-5 text-slate-500">{categoryStatus.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => setEditingDescriptionCategoryId(category.id)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <PencilIcon />
                    Edit description
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleCategoryExpanded(category.id)}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {isExpanded ? "Collapse items" : "Expand items"}
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <>
                  <WeeklyHoursEditor
                    title={category.menuGroup === "ALL_DAY" ? "Menu hour" : "Menu hour for Lunch"}
                    description="Set menu hour for each day. Managers can freely mark a day closed and type exact times."
                    value={hoursForm}
                    disabled={isPending}
                    onChange={(nextValue) =>
                      setCategoryWeeklyHoursForm((current) => ({
                        ...current,
                        [category.id]: nextValue,
                      }))
                    }
                    onSave={() => saveCategoryWeeklyHours(category.id)}
                    saveLabel="Save menu hour"
                  />

                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {category.items.map((item) => {
                      const itemStatus = getItemLiveStatus(category, item.manualOrderingOpen);

                      return (
                        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{item.name}</p>
                              <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.priceCents)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${itemStatus.tone}`}>
                                {itemStatus.label}
                              </span>
                              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                                <span className={`text-xs font-semibold ${item.manualOrderingOpen ? "text-emerald-800" : "text-rose-700"}`}>
                                  {item.manualOrderingOpen ? "Open" : "Closed"}
                                </span>
                                <AvailabilitySwitch
                                  checked={item.manualOrderingOpen}
                                  disabled={isPending || !category.manualOrderingOpen}
                                  onChange={(nextOpen) => toggleItem(item.id, nextOpen)}
                                  label={`${item.manualOrderingOpen ? "Close" : "Open"} ${item.name} item`}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm text-slate-500">
                  Category items and menu hour settings are collapsed. Expand this section to edit item availability and hours.
                </div>
              )}
            </article>
          );
        })}

        {visibleCategories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-8 text-sm text-slate-500 shadow-sm">
            No categories are currently grouped under the {activeMenuView === "ALL_DAY" ? "All Day" : "Lunch"} menu.
          </div>
        ) : null}
      </div>
    </section>
  );
}
