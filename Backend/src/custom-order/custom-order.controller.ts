import { Controller, Get, Post, Put, Body, Param, Request, BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CustomOrderService } from './custom-order.service';
import { OrderStatus, TextLanguage } from '@prisma/client';

class CustomOrderItemDto {
  @IsInt()
  @Min(1)
  variantId: number;

  @IsString()
  printedName: string;

  @IsEnum(TextLanguage)
  textLanguage: TextLanguage;

  @IsBoolean()
  withDjerbaLogo: boolean;

  @IsInt()
  @Min(1)
  quantity: number;
}

class CreateCustomOrderDto {
  @IsOptional()
  @IsString()
  hotelName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CustomOrderItemDto)
  items: CustomOrderItemDto[];
}

@Controller('custom-orders')
export class CustomOrderController {
  constructor(private readonly customOrderService: CustomOrderService) {}

  @Post()
  async createCustomOrder(
    @Request() req,
    @Body() body: CreateCustomOrderDto,
  ) {
    // TODO: Implement authentication and get userId from token
    // For now, we'll need to pass userId in headers or get it from session
    const userId = String(req.headers['x-user-id'] || (body as any)?.userId || '').trim();

    if (!userId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    return this.customOrderService.createCustomOrder(userId, body);
  }

  @Get()
  async getCustomOrders(@Request() req) {
    const userId = String(req.headers['x-user-id'] || '').trim();

    if (!userId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    return this.customOrderService.getCustomOrders(userId);
  }

  @Get('all')
  async getAllCustomOrders() {
    return this.customOrderService.getAllCustomOrders();
  }

  @Get(':id')
  async getCustomOrderById(@Request() req, @Param('id') id: string) {
    const userId = String(req.headers['x-user-id'] || '').trim();

    if (!userId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    return this.customOrderService.getCustomOrderById(userId, id);
  }

  @Put(':id/status')
  async updateCustomOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    return this.customOrderService.updateCustomOrderStatus(id, body.status);
  }

  @Put(':id/cancel')
  async cancelCustomOrder(@Request() req, @Param('id') id: string) {
    const userId = String(req.headers['x-user-id'] || '').trim();

    if (!userId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    return this.customOrderService.cancelCustomOrder(userId, id);
  }
}
