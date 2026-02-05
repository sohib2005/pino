import { PrismaClient, SizeName, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create sizes
  console.log('📏 Creating sizes...');
  const sizes = await Promise.all([
    prisma.size.create({ data: { name: SizeName.XS } }),
    prisma.size.create({ data: { name: SizeName.S } }),
    prisma.size.create({ data: { name: SizeName.M } }),
    prisma.size.create({ data: { name: SizeName.L } }),
    prisma.size.create({ data: { name: SizeName.XL } }),
    prisma.size.create({ data: { name: SizeName.XXL } }),
  ]);
  console.log(`✅ Created ${sizes.length} sizes`);

  // 2. Create categories
  console.log('🏷️  Creating categories...');
  const touristique = await prisma.category.create({
    data: {
      name: 'Touristique',
      description: 'T-shirts pour les touristes avec motifs tunisiens',
    },
  });

  const couple = await prisma.category.create({
    data: {
      name: 'Couple',
      description: 'T-shirts assortis pour couples',
    },
  });

  const enfant = await prisma.category.create({
    data: {
      name: 'Enfant',
      description: 'T-shirts pour enfants',
    },
  });

  const sport = await prisma.category.create({
    data: {
      name: 'Sport',
      description: 'T-shirts de sport',
    },
  });

  console.log('✅ Created 4 categories');

  // 3. Create products
  console.log('👕 Creating products...');
  
  // Touristique products
  const t0 = await prisma.product.create({
    data: {
      code: 'T0',
      name: 'T-Shirt Touristique Djerba',
      description: 'T-shirt blanc avec imprimé Djerba',
      color: 'Blanc',
      price: 25.00,
      categoryId: touristique.id,
      isActive: true,
    },
  });

  const t1 = await prisma.product.create({
    data: {
      code: 'T1',
      name: 'T-Shirt Carthage',
      description: 'T-shirt bleu avec motifs de Carthage',
      color: 'Bleu',
      price: 28.00,
      categoryId: touristique.id,
      isActive: true,
    },
  });

  const t2 = await prisma.product.create({
    data: {
      code: 'T2',
      name: 'T-Shirt Médina Tunis',
      description: 'T-shirt rouge avec design de la médina de Tunis',
      color: 'Rouge',
      price: 27.00,
      categoryId: touristique.id,
      isActive: true,
    },
  });

  // Couple products
  const c0 = await prisma.product.create({
    data: {
      code: 'C0',
      name: 'T-Shirt Couple Love',
      description: 'T-shirt assorti pour couple - Love',
      color: 'Noir',
      price: 30.00,
      categoryId: couple.id,
      isActive: true,
    },
  });

  // Enfant products
  const e0 = await prisma.product.create({
    data: {
      code: 'E0',
      name: 'T-Shirt Enfant Tunisie',
      description: 'T-shirt pour enfant avec drapeau tunisien',
      color: 'Jaune',
      price: 20.00,
      categoryId: enfant.id,
      isActive: true,
    },
  });

  // Sport products
  const s0 = await prisma.product.create({
    data: {
      code: 'S0',
      name: 'T-Shirt Sport Active',
      description: 'T-shirt de sport respirant',
      color: 'Gris',
      price: 35.00,
      categoryId: sport.id,
      isActive: true,
    },
  });

  const products = [t0, t1, t2, c0, e0, s0];
  console.log(`✅ Created ${products.length} products`);

  // 4. Create product variants (product + size combinations)
  console.log('🔢 Creating product variants...');
  let variantCount = 0;

  for (const product of products) {
    for (const size of sizes) {
      const sku = `${product.code}-${size.name}`;
      const stock = Math.floor(Math.random() * 50) + 10; // Random stock 10-59

      await prisma.productVariant.create({
        data: {
          productId: product.id,
          sizeId: size.id,
          sku,
          stock,
        },
      });
      variantCount++;
    }
  }

  console.log(`✅ Created ${variantCount} product variants (${products.length} products × ${sizes.length} sizes)`);

  // 5. Create users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@pino.tn',
      phoneNumber: '11111111',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  const client = await prisma.user.create({
    data: {
      firstName: 'Ahmed',
      lastName: 'Ben Ali',
      email: 'ahmed@example.com',
      phoneNumber: '50770418',
      password: hashedPassword,
      role: Role.CLIENT,
      address: '123 Rue de la République, Tunis',
    },
  });

  const animateur = await prisma.user.create({
    data: {
      firstName: 'Mohamed',
      lastName: 'Animateur',
      email: 'animateur@hotel.tn',
      phoneNumber: '12345678',
      password: hashedPassword,
      role: Role.ANIMATEUR,
      address: 'Hôtel Paradise, Djerba',
    },
  });

  console.log('✅ Created 3 users (Admin, Client, Animateur)');

  // 6. Create cart for client
  console.log('🛒 Creating cart...');
  const cart = await prisma.cart.create({
    data: {
      userId: client.id,
    },
  });
  console.log('✅ Created cart for client');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${sizes.length} sizes`);
  console.log(`   - 4 categories (Touristique, Couple, Enfant, Sport)`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${variantCount} product variants`);
  console.log(`   - 3 users (Admin: 11111111, Client: 50770418, Animateur: 12345678)`);
  console.log(`   - Password for all: password123`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
