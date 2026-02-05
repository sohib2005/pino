import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateCategories() {
  console.log('Updating categories to add default codes...');
  
  const categories = await prisma.category.findMany({
    where: { code: null },
  });

  for (const category of categories) {
    const code = category.name.charAt(0).toUpperCase();
    console.log(`Updating "${category.name}" with code: ${code}`);
    
    await prisma.category.update({
      where: { id: category.id },
      data: { code },
    });
  }

  console.log('Done! Categories updated successfully.');
  await prisma.$disconnect();
}

updateCategories().catch(console.error);
