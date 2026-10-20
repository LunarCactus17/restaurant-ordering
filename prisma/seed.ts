import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function getManagerPasswordHash() {
  const rawPassword = process.env.STAFF_MANAGER_PASSWORD;

  if (!rawPassword) {
    throw new Error("STAFF_MANAGER_PASSWORD is required for seeding the manager account.");
  }

  return argon2.hash(rawPassword, {
    type: argon2.argon2id,
  });
}

type SeedModifierOption = {
  name: string;
  priceDeltaCents: number;
};

type SeedModifierGroup = {
  name: string;
  minSelect: number;
  maxSelect: number;
  isRequired: boolean;
  options: SeedModifierOption[];
};

type SeedItem = {
  code: string;
  name: string;
  priceCents: number;
  description?: string;
  modifierGroups?: SeedModifierGroup[];
};

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  availableFromHour?: number;
  availableUntilHour?: number;
  items: SeedItem[];
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function toCents(price: number) {
  return Math.round(price * 100);
}

const riceChoiceModifierGroupFree: SeedModifierGroup = {
  name: "Rice choice",
  minSelect: 1,
  maxSelect: 1,
  isRequired: true,
  options: [
    { name: "White Rice", priceDeltaCents: 0 },
    { name: "Fried Rice", priceDeltaCents: 0 },
  ],
};

const riceChoiceModifierGroupFriedRiceExtra: SeedModifierGroup = {
  name: "Rice choice",
  minSelect: 1,
  maxSelect: 1,
  isRequired: true,
  options: [
    { name: "White Rice", priceDeltaCents: 0 },
    { name: "Fried Rice", priceDeltaCents: 100 },
  ],
};

function applyRiceChoiceModifier(
  items: SeedItem[],
  modifierGroup: SeedModifierGroup,
): SeedItem[] {
  return items.map((item) => ({
    ...item,
    modifierGroups: [modifierGroup],
  }));
}

function buildMenuItemSlug(code: string, name: string) {
  const codeSlug = slugify(code);
  const nameSlug = slugify(name);

  if (!codeSlug) {
    return nameSlug;
  }

  if (!nameSlug) {
    return codeSlug;
  }

  const codeTokens = codeSlug.split("-").filter(Boolean);
  const nameTokens = nameSlug.split("-").filter(Boolean);

  if (codeTokens.length > 1 && nameTokens.length > 0) {
    let overlap = 0;
    const maxOverlap = Math.min(codeTokens.length, nameTokens.length);

    for (let size = maxOverlap; size > 0; size -= 1) {
      const codeSuffix = codeTokens.slice(-size).join("-");
      const namePrefix = nameTokens.slice(0, size).join("-");

      if (codeSuffix === namePrefix) {
        overlap = size;
        break;
      }
    }

    if (overlap > 0) {
      return [...codeTokens, ...nameTokens.slice(overlap)].join("-");
    }
  }

  return `${codeSlug}-${nameSlug}`;
}

const seedCategories: SeedCategory[] = [
  {
    name: "Appetizers",
    slug: "appetizers",
    description: "Popular starters and shareable fried snacks from the restaurant menu.",
    sortOrder: 1,
    items: [
      { code: "1", name: "Egg Roll", priceCents: toCents(2.2) },
      { code: "2", name: "Spring Roll (2)", priceCents: toCents(3.3) },
      { code: "3", name: "French Fries", priceCents: toCents(5.25) },
      { code: "4", name: "Fried Wonton (10) (Pork)", priceCents: toCents(6) },
      { code: "5", name: "Chinese Donuts (18)", priceCents: toCents(5.75) },
      { code: "6", name: "Shrimp Egg Roll", priceCents: toCents(2.35) },
      {
        code: "7",
        name: "Fried Crab Rangoon (7) (Cream Cheese)",
        priceCents: toCents(6.8),
      },
      { code: "8", name: "Fried Chicken Wings (4)", priceCents: toCents(9.15) },
      { code: "9", name: "Fried or Steamed Dumplings (8)", priceCents: toCents(8.2) },
      { code: "10", name: "Teriyaki Chicken (4)", priceCents: toCents(7.3) },
      { code: "11", name: "Chicken Finger", priceCents: toCents(7.15) },
      { code: "12", name: "Boneless Spare Ribs", priceCents: toCents(9) },
      { code: "14", name: "Pu Pu Platter", priceCents: toCents(16.3) },
    ],
  },
  {
    name: "Soup",
    slug: "soup",
    description: "Pint and quart soups prepared for quick pickup service.",
    sortOrder: 2,
    items: [
      { code: "15-pt", name: "Egg Drop Soup (Pt)", priceCents: toCents(3.2) },
      { code: "15-qt", name: "Egg Drop Soup (Qt)", priceCents: toCents(5.5) },
      { code: "16-pt", name: "Wonton Soup (Pt)", priceCents: toCents(3.5) },
      { code: "16-qt", name: "Wonton Soup (Qt)", priceCents: toCents(5.7) },
      { code: "17-pt", name: "Chicken Rice Soup (Pt)", priceCents: toCents(3.5) },
      { code: "17-qt", name: "Chicken Rice Soup (Qt)", priceCents: toCents(5.7) },
      { code: "18-pt", name: "Chicken Noodle Soup (Pt)", priceCents: toCents(3.5) },
      { code: "18-qt", name: "Chicken Noodle Soup (Qt)", priceCents: toCents(5.7) },
      { code: "19-pt", name: "Vegetable Soup (Pt)", priceCents: toCents(3.5) },
      { code: "19-qt", name: "Vegetable Soup (Qt)", priceCents: toCents(5.7) },
      { code: "20-pt", name: "Wonton Egg Drop Soup (Pt)", priceCents: toCents(4.5) },
      { code: "20-qt", name: "Wonton Egg Drop Soup (Qt)", priceCents: toCents(6.35) },
      { code: "21-pt", name: "Wonton Hot & Sour Soup (Pt)", priceCents: toCents(4.5) },
      { code: "21-qt", name: "Wonton Hot & Sour Soup (Qt)", priceCents: toCents(6.9) },
      { code: "22-pt", name: "Hot & Sour Soup (Pt)", priceCents: toCents(3.7) },
      { code: "22-qt", name: "Hot & Sour Soup (Qt)", priceCents: toCents(5.7) },
      { code: "23", name: "House Special Soup", priceCents: toCents(7.75) },
    ],
  },
  {
    name: "Fried Rice",
    slug: "fried-rice",
    description: "Classic fried rice selections from the live menu sheet.",
    sortOrder: 3,
    items: [
      { code: "24", name: "Vegetable Fried Rice", priceCents: toCents(9.55) },
      { code: "25", name: "Roast Pork Fried Rice", priceCents: toCents(10.75) },
      { code: "26", name: "Chicken Fried Rice", priceCents: toCents(10.75) },
      { code: "27", name: "Shrimp Fried Rice", priceCents: toCents(11.5) },
      { code: "28", name: "Beef Fried Rice", priceCents: toCents(11.5) },
      { code: "29", name: "House Special Fried Rice", priceCents: toCents(12) },
    ],
  },
  {
    name: "Lo Mein",
    slug: "lo-mein",
    description: "Noodle favorites with vegetable, meat, and house-special options.",
    sortOrder: 4,
    items: [
      { code: "30", name: "Vegetable Lo Mein", priceCents: toCents(10.75) },
      { code: "31", name: "Roast Pork Lo Mein", priceCents: toCents(11.5) },
      { code: "32", name: "Chicken Lo Mein", priceCents: toCents(11.5) },
      { code: "33", name: "Shrimp Lo Mein", priceCents: toCents(12.3) },
      { code: "34", name: "Beef Lo Mein", priceCents: toCents(12.3) },
      { code: "35", name: "House Special Lo Mein", priceCents: toCents(13) },
    ],
  },
  {
    name: "Sweet & Sour",
    slug: "sweet-and-sour",
    description: "Sweet-and-sour entrees served pickup-ready.",
    sortOrder: 5,
    items: applyRiceChoiceModifier([
      { code: "36", name: "Sweet & Sour Pork", priceCents: toCents(12.75) },
      { code: "37", name: "Sweet & Sour Chicken", priceCents: toCents(12.75) },
      { code: "38", name: "Sweet & Sour Shrimp", priceCents: toCents(12.75) },
      { code: "39", name: "Sweet & Sour Combo", priceCents: toCents(12.75) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Chow Mein",
    slug: "chow-mein",
    description: "Savory chow mein options from the restaurant workbook.",
    sortOrder: 6,
    items: applyRiceChoiceModifier([
      { code: "40", name: "Vegetable Chow Mein", priceCents: toCents(11.5) },
      { code: "41", name: "Chicken Chow Mein", priceCents: toCents(11.95) },
      { code: "42", name: "Shrimp Chow Mein", priceCents: toCents(12.5) },
      { code: "43", name: "Beef Chow Mein", priceCents: toCents(12.5) },
      { code: "44", name: "House Special Chow Mein", priceCents: toCents(12.9) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Mein Fun",
    slug: "mein-fun",
    description: "Rice noodle dishes, including the Singapore-style option.",
    sortOrder: 7,
    items: [
      { code: "M1", name: "Vegetable Mein Fun", priceCents: toCents(11.75) },
      { code: "M2", name: "Roast Pork Mein Fun", priceCents: toCents(12.45) },
      { code: "M3", name: "Chicken Mein Fun", priceCents: toCents(12.45) },
      { code: "M4", name: "Shrimp Mein Fun", priceCents: toCents(13.45) },
      { code: "M5", name: "Beef Mein Fun", priceCents: toCents(13.45) },
      { code: "M6", name: "House Mein Fun", priceCents: toCents(13.65) },
      { code: "M7", name: "Singapore Mein Fun", priceCents: toCents(13.65) },
    ],
  },
  {
    name: "Egg Foo Young",
    slug: "egg-foo-young",
    description: "Egg foo young entrees across vegetable, meat, and seafood variants.",
    sortOrder: 8,
    items: applyRiceChoiceModifier([
      { code: "45", name: "Vegetable Egg Foo Young", priceCents: toCents(11.25) },
      { code: "46", name: "Roast Pork Egg Foo Young", priceCents: toCents(11.75) },
      { code: "47", name: "Chicken Egg Foo Young", priceCents: toCents(11.75) },
      { code: "48", name: "Beef Egg Foo Young", priceCents: toCents(12.5) },
      { code: "49", name: "Shrimp Egg Foo Young", priceCents: toCents(12.5) },
      { code: "50", name: "House Special Egg Foo Young", priceCents: toCents(12.95) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Vegetable",
    slug: "vegetable-entrees",
    description: "Vegetable-forward entrees from the all-day menu.",
    sortOrder: 9,
    items: applyRiceChoiceModifier([
      { code: "51", name: "Mixed Vegetables", priceCents: toCents(11.25) },
      { code: "52", name: "Broccoli w. Garlic Sauce", priceCents: toCents(11.75) },
      { code: "53", name: "Hunan Tofu", priceCents: toCents(12.25) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Moo Shu",
    slug: "moo-shu",
    description: "Moo shu selections prepared for pickup service.",
    sortOrder: 10,
    items: [
      { code: "54", name: "Moo Shu Vegetables", priceCents: toCents(11.5) },
      { code: "55", name: "Moo Shu Pork or Chicken", priceCents: toCents(12.75) },
      { code: "56", name: "Moo Shu Beef", priceCents: toCents(13.3) },
      { code: "57", name: "Moo Shu Shrimp", priceCents: toCents(13.3) },
    ],
  },
  {
    name: "Chicken",
    slug: "chicken-entrees",
    description: "All-day chicken entrees. White rice is included per menu notes.",
    sortOrder: 11,
    items: applyRiceChoiceModifier([
      { code: "58", name: "Black Pepper Chicken", priceCents: toCents(13) },
      { code: "59", name: "Chicken w. Cashew Nut", priceCents: toCents(13) },
      { code: "60", name: "Moo Goo Gai Pan", priceCents: toCents(13) },
      { code: "61", name: "Chicken w. Broccoli", priceCents: toCents(13) },
      { code: "62", name: "Chicken w. Snow Peas", priceCents: toCents(13) },
      { code: "63", name: "Chicken w. Mixed Vegetables", priceCents: toCents(13) },
      { code: "64", name: "Kung Po Chicken", priceCents: toCents(13) },
      { code: "65", name: "Chicken w. Garlic Sauce", priceCents: toCents(13) },
      { code: "66", name: "Chicken w. Curry Sauce", priceCents: toCents(13) },
      { code: "67", name: "Szechuan Chicken", priceCents: toCents(13) },
      { code: "68", name: "Hunan Chicken", priceCents: toCents(13) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Beef",
    slug: "beef-entrees",
    description: "All-day beef entrees. White rice is included per menu notes.",
    sortOrder: 12,
    items: applyRiceChoiceModifier([
      { code: "69", name: "Beef w. Chinese Vegetables", priceCents: toCents(13.5) },
      { code: "70", name: "Beef w. Mushroom", priceCents: toCents(13.5) },
      { code: "71", name: "Beef w. Broccoli", priceCents: toCents(13.5) },
      { code: "72", name: "Pepper Steak", priceCents: toCents(13.5) },
      { code: "73", name: "Beef w. Snow Peas", priceCents: toCents(13.5) },
      { code: "74", name: "Beef w. Curry Sauce", priceCents: toCents(13.5) },
      { code: "75", name: "Beef w. Garlic Sauce", priceCents: toCents(13.5) },
      { code: "76", name: "Szechuan Beef", priceCents: toCents(13.5) },
      { code: "77", name: "Hunan Beef", priceCents: toCents(13.5) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Roast Pork",
    slug: "roast-pork",
    description: "Roast pork entrees from the all-day menu.",
    sortOrder: 13,
    items: applyRiceChoiceModifier([
      { code: "78", name: "Roast Pork w. Broccoli", priceCents: toCents(13) },
      { code: "79", name: "Roast Pork w. Snow Peas", priceCents: toCents(13) },
      { code: "80", name: "Double Cooked Pork", priceCents: toCents(13) },
      { code: "81", name: "Szechuan Pork", priceCents: toCents(13) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Seafood",
    slug: "seafood",
    description: "Seafood entrees from the all-day menu. White rice is included per menu notes.",
    sortOrder: 14,
    items: applyRiceChoiceModifier([
      { code: "82", name: "Shrimp w. Lobster Sauce", priceCents: toCents(14) },
      { code: "83", name: "Shrimp w. Cashew Nuts", priceCents: toCents(14) },
      { code: "84", name: "Shrimp w. Broccoli", priceCents: toCents(14) },
      { code: "85", name: "Shrimp w. Snow Peas", priceCents: toCents(14) },
      { code: "86", name: "Shrimp w. Chinese Vegetables", priceCents: toCents(14) },
      { code: "87", name: "Shrimp w. Garlic Sauce", priceCents: toCents(14) },
      { code: "88", name: "Shrimp w. Curry Sauce", priceCents: toCents(14) },
      { code: "89", name: "Kung Po Shrimp", priceCents: toCents(14) },
      { code: "90", name: "Szechuan Shrimp", priceCents: toCents(14) },
      { code: "91", name: "Hunan Shrimp", priceCents: toCents(14) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Side Order",
    slug: "side-order",
    description: "All-day rice, sauces, and small add-ons for pickup orders.",
    sortOrder: 15,
    items: [
      { code: "side-white-rice-s", name: "White Rice (S)", priceCents: toCents(3.15) },
      { code: "side-white-rice-l", name: "White Rice (L)", priceCents: toCents(5) },
      { code: "side-fortune-cookies", name: "Fortune Cookies (4)", priceCents: toCents(1) },
      { code: "side-fried-noodle", name: "Fried Noodle", priceCents: toCents(0.9) },
      {
        code: "side-sweet-sour-half",
        name: "Sweet & Sour Sauce (Half)",
        priceCents: toCents(1.15),
      },
      {
        code: "side-sweet-sour-pt",
        name: "Sweet & Sour Sauce (Pt)",
        priceCents: toCents(1.9),
      },
      { code: "side-brown-half", name: "Brown Sauce (Half)", priceCents: toCents(1.5) },
      { code: "side-brown-pt", name: "Brown Sauce (Pt)", priceCents: toCents(2.25) },
      {
        code: "side-general-tso-half",
        name: "General Tso's Sauce (Half)",
        priceCents: toCents(1.5),
      },
      {
        code: "side-general-tso-pt",
        name: "General Tso's Sauce (Pt)",
        priceCents: toCents(2.25),
      },
    ],
  },
  {
    name: "Special Combination Platter",
    slug: "special-combination-platter",
    description: "Combination platters from the workbook at the regular menu price.",
    sortOrder: 16,
    items: applyRiceChoiceModifier([
      { code: "C1", name: "Vegetable Delight Combo", priceCents: toCents(11) },
      { code: "C2", name: "Chicken Finger Combo", priceCents: toCents(11) },
      { code: "C3", name: "Chicken Chow Mein Combo", priceCents: toCents(11) },
      { code: "C4", name: "Sweet & Sour Chicken Combo", priceCents: toCents(11) },
      { code: "C5", name: "Sweet & Sour Pork Combo", priceCents: toCents(11) },
      { code: "C6", name: "Chicken w. Broccoli Combo", priceCents: toCents(11) },
      { code: "C7", name: "Beef w. Broccoli Combo", priceCents: toCents(11) },
      { code: "C8", name: "Shrimp w. Broccoli Combo", priceCents: toCents(11) },
      { code: "C9", name: "Chicken Lo Mein Combo", priceCents: toCents(11) },
      { code: "C10", name: "Pork Lo Mein Combo", priceCents: toCents(11) },
      { code: "C11", name: "Beef Lo Mein Combo", priceCents: toCents(11) },
      { code: "C12", name: "Shrimp Lo Mein Combo", priceCents: toCents(11) },
      { code: "C13", name: "Moo Goo Gai Pan Combo", priceCents: toCents(11) },
      { code: "C14", name: "Chicken w. Cashew Nuts Combo", priceCents: toCents(11) },
      { code: "C15", name: "Chicken w. Mixed Vegetables Combo", priceCents: toCents(11) },
      { code: "C16", name: "Chicken w. Snow Peas Combo", priceCents: toCents(11) },
      { code: "C17", name: "Pepper Steak Combo", priceCents: toCents(11) },
      { code: "C18", name: "Shrimp w. Chinese Vegetables Combo", priceCents: toCents(11) },
      { code: "C19", name: "Shrimp Chow Mein Combo", priceCents: toCents(11) },
      { code: "C20", name: "Shrimp w. Lobster Sauce Combo", priceCents: toCents(11) },
      { code: "C21", name: "Teriyaki Chicken Combo", priceCents: toCents(11) },
      { code: "C22", name: "Shrimp & Chicken w. Broccoli Combo", priceCents: toCents(11) },
      { code: "C23", name: "Broccoli w. Garlic Sauce Combo", priceCents: toCents(11) },
      { code: "C24", name: "Chicken w. Garlic Sauce Combo", priceCents: toCents(11) },
      { code: "C25", name: "General Tso's Chicken Combo", priceCents: toCents(11) },
      { code: "C26", name: "Shrimp w. Garlic Sauce Combo", priceCents: toCents(11) },
      { code: "C27", name: "Hunan Beef Combo", priceCents: toCents(11) },
      { code: "C28", name: "Sesame Chicken Combo", priceCents: toCents(11) },
      { code: "C29", name: "Szechuan Chicken Combo", priceCents: toCents(11) },
      { code: "C30", name: "Szechuan Beef Combo", priceCents: toCents(11) },
      { code: "C31", name: "Szechuan Shrimp Combo", priceCents: toCents(11) },
      { code: "C32", name: "Hunan Chicken Combo", priceCents: toCents(11) },
      { code: "C33", name: "Kung Po Chicken Combo", priceCents: toCents(11) },
    ], riceChoiceModifierGroupFree),
  },
  {
    name: "Chef's Specialties",
    slug: "chefs-specialties",
    description: "Chef specials from the workbook at the regular menu price.",
    sortOrder: 17,
    items: applyRiceChoiceModifier([
      { code: "S1", name: "Boneless Chicken", priceCents: toCents(13.75) },
      { code: "S2", name: "Lemon Chicken", priceCents: toCents(13.75) },
      { code: "S3", name: "Scallop & Beef w. Broccoli", priceCents: toCents(14.75) },
      { code: "S4", name: "Happy Family", priceCents: toCents(16.75) },
      { code: "S5", name: "Seafood Delight", priceCents: toCents(16.75) },
      { code: "S6", name: "Triple Delight", priceCents: toCents(14.75) },
      { code: "S7", name: "Four Seasons", priceCents: toCents(14.75) },
      { code: "S8", name: "Beef & Shrimp w. Broccoli", priceCents: toCents(14.75) },
      { code: "S9", name: "General Tso's Chicken", priceCents: toCents(13.75) },
      { code: "S10", name: "Orange Chicken", priceCents: toCents(13.75) },
      { code: "S11", name: "Mongolian Beef", priceCents: toCents(14.25) },
      { code: "S12", name: "Sesame Chicken", priceCents: toCents(13.75) },
      { code: "S13", name: "Tai Chien Chicken", priceCents: toCents(13.75) },
      { code: "S14", name: "Scallop & Shrimp w. Garlic Sauce", priceCents: toCents(14.75) },
      { code: "S15", name: "House Special Combination", priceCents: toCents(15.5) },
      { code: "S16", name: "Honey Chicken", priceCents: toCents(14.5) },
      { code: "S17", name: "Bourbon Chicken", priceCents: toCents(15.75) },
      { code: "S18", name: "Almond Chicken", priceCents: toCents(13.75) },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Diet Menu",
    slug: "diet-menu",
    description: "Lighter steamed dishes from the menu workbook.",
    sortOrder: 18,
    items: applyRiceChoiceModifier([
      { code: "H1", name: "Steamed Mixed Vegetables", priceCents: toCents(11.75) },
      { code: "H2", name: "Steamed Chicken w. Broccoli", priceCents: toCents(13.25) },
      {
        code: "H3",
        name: "Steamed Garden Vegetables w. Chicken",
        priceCents: toCents(13.25),
      },
      {
        code: "H4",
        name: "Steamed Garden Vegetables w. Beef",
        priceCents: toCents(13.5),
      },
      {
        code: "H5",
        name: "Steamed Garden Vegetables w. Shrimp",
        priceCents: toCents(14.25),
      },
      {
        code: "H6",
        name: "Steamed Jumbo Shrimp, Scallop, Chicken w. Mixed Vegetable",
        priceCents: toCents(15.75),
      },
    ], riceChoiceModifierGroupFriedRiceExtra),
  },
  {
    name: "Lunch Special",
    slug: "lunch-special-11am-3pm",
    description: "Lunch specials from the spreadsheet at the regular menu price.",
    sortOrder: 19,
    availableFromHour: 11,
    availableUntilHour: 15,
    items: applyRiceChoiceModifier([
      { code: "L1", name: "Vegetable Delight Lunch", priceCents: toCents(8.95) },
      { code: "L2", name: "Chicken Chow Mein Lunch", priceCents: toCents(8.95) },
      { code: "L3", name: "Sweet & Sour Chicken Lunch", priceCents: toCents(8.95) },
      { code: "L4", name: "Sweet & Sour Pork Lunch", priceCents: toCents(8.95) },
      { code: "L5", name: "Roast Pork w. Broccoli Lunch", priceCents: toCents(8.95) },
      { code: "L6", name: "Chicken w. Broccoli Lunch", priceCents: toCents(8.95) },
      { code: "L7", name: "Beef w. Broccoli Lunch", priceCents: toCents(8.95) },
      { code: "L8", name: "Shrimp w. Broccoli Lunch", priceCents: toCents(8.95) },
      { code: "L9", name: "Chicken Lo Mein Lunch", priceCents: toCents(8.95) },
      { code: "L10", name: "Pork Lo Mein Lunch", priceCents: toCents(8.95) },
      { code: "L11", name: "Beef Lo Mein Lunch", priceCents: toCents(8.95) },
      { code: "L12", name: "Shrimp Lo Mein Lunch", priceCents: toCents(8.95) },
      { code: "L13", name: "Moo Goo Gai Pan Lunch", priceCents: toCents(8.95) },
      { code: "L14", name: "Chicken w. Cashew Nuts Lunch", priceCents: toCents(8.95) },
      { code: "L15", name: "Chicken w. Mixed Vegetables Lunch", priceCents: toCents(8.95) },
      { code: "L16", name: "Chicken w. Snow Peas Lunch", priceCents: toCents(8.95) },
      { code: "L17", name: "Beef w. Mixed Vegetables Lunch", priceCents: toCents(8.95) },
      { code: "L18", name: "Pepper Steak Lunch", priceCents: toCents(8.95) },
      { code: "L19", name: "Shrimp w. Chinese Vegetables Lunch", priceCents: toCents(8.95) },
      { code: "L20", name: "Shrimp Chow Mein Lunch", priceCents: toCents(8.95) },
      { code: "L21", name: "Teriyaki Chicken Lunch", priceCents: toCents(8.95) },
      { code: "L22", name: "Shrimp & Chicken w. Broccoli Lunch", priceCents: toCents(8.95) },
      { code: "L23", name: "Broccoli w. Garlic Sauce Lunch", priceCents: toCents(8.95) },
      { code: "L24", name: "Chicken w. Garlic Sauce Lunch", priceCents: toCents(8.95) },
      { code: "L25", name: "General Tso's Chicken Lunch", priceCents: toCents(8.95) },
      { code: "L26", name: "Shrimp w. Garlic Sauce Lunch", priceCents: toCents(8.95) },
      { code: "L27", name: "Kung Po Chicken Lunch", priceCents: toCents(8.95) },
      { code: "L28", name: "Hunan Beef Lunch", priceCents: toCents(8.95) },
      { code: "L29", name: "Hunan Chicken Lunch", priceCents: toCents(8.95) },
      { code: "L30", name: "Sesame Chicken Lunch", priceCents: toCents(8.95) },
      { code: "L31", name: "Szechuan Beef Lunch", priceCents: toCents(8.95) },
      { code: "L32", name: "Szechuan Shrimp Lunch", priceCents: toCents(8.95) },
      { code: "L33", name: "Szechuan Chicken Lunch", priceCents: toCents(8.95) },
    ], riceChoiceModifierGroupFree),
  },
];

async function main() {
  await prisma.managerSession.deleteMany();
  await prisma.managerAccount.deleteMany();
  await prisma.orderItemModifier.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.modifierOption.deleteMany();
  await prisma.modifierGroup.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();

  await prisma.managerAccount.create({
    data: {
      username: process.env.STAFF_MANAGER_USERNAME?.trim() || "owner",
      passwordHash: await getManagerPasswordHash(),
    },
  });

  for (const category of seedCategories) {
    await prisma.category.create({
      data: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        sortOrder: category.sortOrder,
        availableFromHour: category.availableFromHour,
        availableUntilHour: category.availableUntilHour,
        items: {
          create: category.items.map((item, index) => ({
            name: item.name,
            slug: buildMenuItemSlug(item.code, item.name),
            description: item.description ?? null,
            priceCents: item.priceCents,
            sortOrder: index + 1,
            modifierGroups: item.modifierGroups
              ? {
                  create: item.modifierGroups.map((group, groupIndex) => ({
                    name: group.name,
                    minSelect: group.minSelect,
                    maxSelect: group.maxSelect,
                    isRequired: group.isRequired,
                    sortOrder: groupIndex + 1,
                    options: {
                      create: group.options.map((option, optionIndex) => ({
                        name: option.name,
                        priceDeltaCents: option.priceDeltaCents,
                        sortOrder: optionIndex + 1,
                      })),
                    },
                  })),
                }
              : undefined,
          })),
        },
      },
    });
  }

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
