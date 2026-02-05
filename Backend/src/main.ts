import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';

// Fix BigInt serialization for PostgreSQL
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // Enable validation globally
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error for extra properties
      transform: true, // Transform payloads to DTO instances
    }));
    
    // Serve static files from uploads directory
    // Using process.cwd() is more reliable than __dirname for compiled code
    app.useStaticAssets(join(process.cwd(), 'uploads'), {
      prefix: '/uploads/',
    });
    
    console.log('📁 Static files served from:', join(process.cwd(), 'uploads'));
    console.log('🌐 Accessible at: http://localhost:3001/uploads/*');
    
    // Enable CORS for frontend
    app.enableCors({
      origin: 'http://localhost:3000', // Next.js default port
      credentials: true,
    });

    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
}
bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap:', error);
  process.exit(1);
});
