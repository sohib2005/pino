import { Module } from '@nestjs/common';
import { CustomOrderController } from './custom-order.controller';
import { CustomOrderService } from './custom-order.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CustomOrderController],
  providers: [CustomOrderService, PrismaService],
  exports: [CustomOrderService],
})
export class CustomOrderModule {}
