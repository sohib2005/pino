require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function testConnection() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'NOT SET');
  console.log('PORT:', process.env.PORT);
  
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('Connected successfully!');
    
    console.log('Fetching t-shirts...');
    const tshirts = await prisma.tShirt.findMany({
      take: 3
    });
    console.log(`Found ${tshirts.length} t-shirts`);
    console.log('Sample:', JSON.stringify(tshirts[0], null, 2));
    
    await prisma.$disconnect();
    console.log('Disconnected successfully');
    process.exit(0);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

testConnection();
