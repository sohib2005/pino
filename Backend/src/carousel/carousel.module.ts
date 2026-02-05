import { Module } from '@nestjs/common';
import { CarouselController } from './carousel.controller';
import { CarouselService } from './carousel.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CarouselController],
  providers: [CarouselService, PrismaService],
  exports: [CarouselService],
})
export class CarouselModule {}
