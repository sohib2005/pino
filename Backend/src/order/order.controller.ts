import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async createOrder(
    @Request() req,
    @Body()
    body: {
      address: string;
      phoneNumber: string;
      notes?: string;
    },
  ) {
    const userId = req.headers['x-user-id'] || '024ec841-36c9-4a6c-8173-c1c423e2095b';
    return this.orderService.createOrder(userId, body);
  }

  @Post('guest')
  async createGuestOrder(
    @Body()
    body: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      address: string;
      notes?: string;
      items: Array<{
        variantId: string;
        quantity: number;
      }>;
    },
  ) {
    return this.orderService.createGuestOrder(body);
  }

  @Get()
  async getOrders(@Request() req) {
    const userId = req.headers['x-user-id'] || '024ec841-36c9-4a6c-8173-c1c423e2095b';
    return this.orderService.getOrders(userId);
  }

  @Get('all')
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  @Get(':id')
  async getOrderById(@Request() req, @Param('id') id: string) {
    const userId = req.headers['x-user-id'] || '024ec841-36c9-4a6c-8173-c1c423e2095b';
    return this.orderService.getOrderById(userId, id);
  }

  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.orderService.updateOrderStatus(id, body.status);
  }

  @Put(':id/cancel')
  async cancelOrder(@Request() req, @Param('id') id: string) {
    const userId = req.headers['x-user-id'] || '024ec841-36c9-4a6c-8173-c1c423e2095b';
    return this.orderService.cancelOrder(userId, id);
  }
}
