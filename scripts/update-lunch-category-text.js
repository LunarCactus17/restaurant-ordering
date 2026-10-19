const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.category.updateMany({
    where: { slug: 'lunch-special-11am-3pm' },
    data: {
      name: 'Lunch Special',
      description: 'Lunch specials from the spreadsheet at the regular menu price.',
    },
  });

  console.log(JSON.stringify(result));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
