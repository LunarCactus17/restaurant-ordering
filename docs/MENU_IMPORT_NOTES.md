# Menu Import Notes

## Source workbook
- File: `media/inbound/openclaw-staged-be167cda-ad41-4a53-a831-be36fbaa6556/Lins_Garden_Menu online.xlsx`
- Workbook sheet used: `Menu`

## Pricing column rule for pickup-only MVP
The workbook contains three price columns:
- `Regular price` — in-store baseline price
- `Delivery price` — computed from regular price with the workbook's 22% delivery markup
- `Online pick up price` — computed from regular price with the workbook's 6% online pickup multiplier

For this MVP, the business rule is:
- use `Online pick up price` as the website selling price for customer-facing menu items
- ignore `Delivery price` because delivery is out of scope
- preserve the workbook's `Regular price` and `Delivery price` only as reference for future operations or admin tooling

This keeps the live site aligned to the uploaded spreadsheet while respecting the confirmed pickup-only product scope.

## Verification result on 2026-10-16
Excel data rows detected in the workbook: `195`

Seed alignment result after review:
- workbook-backed customer menu rows: `195`
- additional seed-only rows: `10`
- total seeded menu rows: `205`

### Workbook-backed rows fully represented
The seed now covers all workbook sections:
- Appetizers
- Soup
- Fried Rice
- Lo Mein
- Sweet & Sour
- Chow Mein
- Mein Fun
- Egg Foo Young
- Vegetable
- Moo Shu
- Chicken
- Beef
- Roast Pork
- Seafood
- Special Combination Platter
- Chef's Specialties
- Diet Menu
- Lunch Special (11am-3pm)

### Intentional seed-only additions
The workbook does not contain a `Side Order` section, but the seed intentionally includes these extra all-day menu add-ons:
- White Rice (S)
- White Rice (L)
- Fortune Cookies (4)
- Fried Noodle
- Sweet & Sour Sauce (Half)
- Sweet & Sour Sauce (Pt)
- Brown Sauce (Half)
- Brown Sauce (Pt)
- General Tso's Sauce (Half)
- General Tso's Sauce (Pt)

Owner decision confirmed on 2026-10-16:
- `Side Order` must remain as a real category in the all-day menu
- these seed-only items are intentionally part of the MVP menu even though they are not listed in the uploaded workbook

## Normalization rules used in seed
- Prices are stored from workbook `Online pick up price`
- Codes like `C1`, `S1`, `H1`, and `L1` are preserved
- Soup rows reuse the workbook item number plus a `-pt` / `-qt` suffix in seed codes so each generated slug stays unique while preserving the workbook number family
- Slugs are generated from normalized code + item name, with duplicate prefixes collapsed when the code already contains a readable item slug fragment

## Corrections made during verification
The following issues were fixed while reconciling the workbook with `prisma/seed.ts`:
- corrected appetizer pickup prices for items `8` through `12`
- corrected multiple mislabeled `Special Combination Platter` items
- corrected multiple mislabeled `Lunch Special (11am-3pm)` items

## Availability rule now implemented
- `Lunch Special (11am-3pm)` is now treated as a lunch-only category in the app
- customer-facing menu loading hides that category outside `11:00 AM` to `3:00 PM` in `America/New_York`
- direct ordering protection also blocks lunch items outside that window on the server
- the Prisma seed stores `availableFromHour=11` and `availableUntilHour=15` for the lunch category
- app availability checks now read category schedule fields instead of relying on a hard-coded lunch slug rule

## Remaining product work
- extend availability from category-level hours to fully data-driven item-level scheduling if the restaurant needs it
- optionally identify the authoritative non-workbook business source for `Side Order` pricing and maintenance
