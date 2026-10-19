import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalize);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, current]) => [key, normalize(current)]),
    );
  }

  return value;
}

async function main() {
  const databaseList = await prisma.$queryRawUnsafe("PRAGMA database_list;");
  const categoryColumns = await prisma.$queryRawUnsafe("PRAGMA table_info('Category');");

  console.log(
    JSON.stringify(
      normalize({
        databaseList,
        categoryColumns,
      }),
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
