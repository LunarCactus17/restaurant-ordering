import fs from "node:fs";
import XLSX from "xlsx";

const workbookPath = "C:\\Users\\xuhui\\.openclaw\\workspace\\media\\inbound\\openclaw-staged-be167cda-ad41-4a53-a831-be36fbaa6556\\Lins_Garden_Menu online.xlsx";
const seedPath = "C:\\Users\\xuhui\\.openclaw\\workspace\\restaurant-ordering\\prisma\\seed.ts";

function normalizeName(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function priceToString(value) {
  return Number(value).toFixed(2);
}

const workbook = XLSX.readFile(workbookPath);
const rows = XLSX.utils.sheet_to_json(workbook.Sheets.Menu, { header: 1, defval: "" });
const excelRows = rows
  .slice(3)
  .filter((row) => row[0] && row[1] && row[2])
  .map((row) => ({
    section: String(row[0]).trim(),
    code: String(row[1]).trim(),
    name: normalizeName(row[2]),
    regular: priceToString(row[3]),
    delivery: priceToString(row[4]),
    pickup: priceToString(row[5]),
  }));

const seedText = fs.readFileSync(seedPath, "utf8");
const categoryRegex = /name: "([^"]+)",[\s\S]*?items: \[((?:.|\r|\n)*?)\n\s*\],/g;
const itemRegex = /code: "([^"]+)",\s+name: "([^"]+)",\s+priceCents: toCents\(([^)]+)\)/g;

const seedRows = [];
let categoryMatch;
while ((categoryMatch = categoryRegex.exec(seedText))) {
  const section = categoryMatch[1];
  const block = categoryMatch[2];
  let itemMatch;
  while ((itemMatch = itemRegex.exec(block))) {
    seedRows.push({
      section,
      code: itemMatch[1],
      name: normalizeName(itemMatch[2]),
      pickup: priceToString(itemMatch[3]),
    });
  }
}

const excelByCode = new Map(excelRows.map((row) => [row.code, row]));
const seedByCode = new Map(seedRows.map((row) => [row.code, row]));

const missingInSeed = excelRows.filter((row) => !seedByCode.has(row.code));
const extraInSeed = seedRows.filter((row) => !excelByCode.has(row.code));
const mismatches = [];

for (const excelRow of excelRows) {
  const seedRow = seedByCode.get(excelRow.code);
  if (!seedRow) continue;

  const differences = {};
  if (excelRow.section !== seedRow.section) differences.section = { excel: excelRow.section, seed: seedRow.section };
  if (excelRow.name !== seedRow.name) differences.name = { excel: excelRow.name, seed: seedRow.name };
  if (excelRow.pickup !== seedRow.pickup) differences.pickup = { excel: excelRow.pickup, seed: seedRow.pickup };

  if (Object.keys(differences).length > 0) {
    mismatches.push({ code: excelRow.code, differences });
  }
}

const sectionCounts = excelRows.reduce((acc, row) => {
  acc[row.section] = (acc[row.section] ?? 0) + 1;
  return acc;
}, {});

console.log(
  JSON.stringify(
    {
      excelCount: excelRows.length,
      seedCount: seedRows.length,
      sectionCounts,
      missingInSeed,
      extraInSeed,
      mismatches,
    },
    null,
    2,
  ),
);
