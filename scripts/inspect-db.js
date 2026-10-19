import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [categoryCount, itemCount, lunchCategory, comboCategory, sideOrderCategory] = await Promise.all([
    prisma.category.count(),
    prisma.menuItem.count(),
    prisma.category.findUnique({
      where: { slug: "lunch-special-11am-3pm" },
      include: { items: { orderBy: { sortOrder: "asc" }, take: 5 } },
    }),
    prisma.category.findUnique({
      where: { slug: "special-combination-platter" },
      include: { items: { orderBy: { sortOrder: "asc" }, take: 5 } },
    }),
    prisma.category.findUnique({
      where: { slug: "side-order" },
      include: { items: { orderBy: { sortOrder: "asc" }, take: 10 } },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        categoryCount,
        itemCount,
        lunchPreview: lunchCategory
          ? {
              name: lunchCategory.name,
              availableFromHour: lunchCategory.availableFromHour,
              availableUntilHour: lunchCategory.availableUntilHour,
              itemCount: lunchCategory.items.length,
              firstItems: lunchCategory.items.map((item) => ({
                slug: item.slug,
                name: item.name,
                priceCents: item.priceCents,
              })),
            }
          : null,
        comboPreview: comboCategory
          ? {
              name: comboCategory.name,
              itemCount: comboCategory.items.length,
              firstItems: comboCategory.items.map((item) => ({
                slug: item.slug,
                name: item.name,
                priceCents: item.priceCents,
              })),
            }
          : null,
        sideOrderPreview: sideOrderCategory
          ? {
              name: sideOrderCategory.name,
              availableFromHour: sideOrderCategory.availableFromHour,
              availableUntilHour: sideOrderCategory.availableUntilHour,
              itemCount: sideOrderCategory.items.length,
              firstItems: sideOrderCategory.items.map((item) => ({
                slug: item.slug,
                name: item.name,
                priceCents: item.priceCents,
              })),
            }
          : null,
      },
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
