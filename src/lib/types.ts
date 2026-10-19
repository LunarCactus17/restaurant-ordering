export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export type MenuModifierOption = {
  id: string;
  name: string;
  priceDeltaCents: number;
  isAvailable: boolean;
  sortOrder: number;
};

export type MenuModifierGroup = {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  options: MenuModifierOption[];
};

export type MenuItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  priceCents: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  manualOrderingOpen: boolean;
  sortOrder: number;
  modifierGroups: MenuModifierGroup[];
};

export type MenuCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  manualOrderingOpen: boolean;
  availableFromHour?: number | null;
  availableUntilHour?: number | null;
  weeklyHours?: WeeklyMenuHours;
  menuGroup?: "ALL_DAY" | "LUNCH";
  isCurrentlyOrderable?: boolean;
  availabilityNote?: string;
  items: MenuItem[];
};

export type BusinessDayKey =
  | "SUNDAY"
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";

export type DailyMenuHours = {
  isClosed: boolean;
  openMinutes: number | null;
  closeMinutes: number | null;
};

export type WeeklyMenuHours = Record<BusinessDayKey, DailyMenuHours>;

export type CheckoutFieldErrors = {
  phone?: string;
  customerName?: string;
  requestedPickupAt?: string;
  notes?: string;
  items?: string;
};

export type CartItemModifierSelection = {
  modifierGroupId: string;
  modifierGroupName: string;
  optionId: string;
  optionName: string;
  priceDeltaCents: number;
};

export type CartItem = {
  id: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  basePriceCents: number;
  specialInstructions?: string;
  selectedOptions: CartItemModifierSelection[];
};

export type StaffOrderItemModifier = {
  id: string;
  optionNameSnapshot: string;
  priceDeltaCents: number;
};

export type StaffOrderItem = {
  id: string;
  itemNameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  specialInstructions?: string | null;
  modifiers: StaffOrderItemModifier[];
};

export type StaffOrder = {
  id: string;
  orderNumber: number;
  customerName?: string | null;
  phone: string;
  notes?: string | null;
  requestedPickupAt?: Date | null;
  status: OrderStatus;
  paymentReceived: boolean;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  createdAt: Date;
  orderItems: StaffOrderItem[];
};

export type StaffOrderGroup = {
  status: OrderStatus;
  label: string;
  description: string;
  orders: StaffOrder[];
};

export type StaffOrderHistorySummary = {
  date: string;
  orderCount: number;
  totalSalesCents: number;
};

export type StaffMenuItemAvailability = {
  id: string;
  name: string;
  priceCents: number;
  manualOrderingOpen: boolean;
  isAvailable: boolean;
};

export type StaffMenuCategoryAvailability = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  manualOrderingOpen: boolean;
  availableFromHour?: number | null;
  availableUntilHour?: number | null;
  menuGroup: "ALL_DAY" | "LUNCH";
  weeklyHours?: WeeklyMenuHours;
  items: StaffMenuItemAvailability[];
};

export type StaffCategoryScheduleInput = {
  availableFromHour: number | null;
  availableUntilHour: number | null;
};

export type StaffWeeklyHoursInput = WeeklyMenuHours;

export type StoreSettings = {
  estimatedPickupMinutes: number;
  weeklyHours: WeeklyMenuHours;
};

export type OrderConfirmation = {
  orderNumber: number;
  customerName?: string | null;
  phone: string;
  notes?: string | null;
  requestedPickupAt?: Date | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    lineTotalCents: number;
    modifiers: string[];
  }[];
};
