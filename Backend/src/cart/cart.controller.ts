import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Request() req) {
    // Pour l'instant, on utilise un userId hardcodé
    // TODO: Implémenter l'authentification et récupérer l'userId du token
    let userId = req.headers['x-user-id'];
    
    // If no user ID provided, get the first client user
    if (!userId) {
      const user = await this.cartService['prisma'].user.findFirst({
        where: { role: 'CLIENT' }
      });
      if (!user) {
        throw new Error('No user found');
      }
      userId = user.id.toString();
    }
    
    return this.cartService.getCart(userId);
  }

  @Post('add')
  async addToCart(
    @Request() req,
    @Body() body: { variantId: number; quantity: number; personalizationId?: string },
  ) {
    let userId = req.headers['x-user-id'];
    if (!userId) {
      const user = await this.cartService['prisma'].user.findFirst({ where: { role: 'CLIENT' } });
      if (!user) throw new Error('No user found');
      userId = user.id.toString();
    }
    return this.cartService.addToCart(userId, body.variantId, body.quantity, body.personalizationId);
  }

  @Put('items/:id')
  async updateCartItem(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ) {
    let userId = req.headers['x-user-id'];
    if (!userId) {
      const user = await this.cartService['prisma'].user.findFirst({ where: { role: 'CLIENT' } });
      if (!user) throw new Error('No user found');
      userId = user.id.toString();
    }
    return this.cartService.updateCartItem(userId, Number(id), body.quantity);
  }

  @Delete('items/:id')
  async removeFromCart(@Request() req, @Param('id') id: string) {
    let userId = req.headers['x-user-id'];
    if (!userId) {
      const user = await this.cartService['prisma'].user.findFirst({ where: { role: 'CLIENT' } });
      if (!user) throw new Error('No user found');
      userId = user.id.toString();
    }
    return this.cartService.removeFromCart(userId, Number(id));
  }

  @Delete('clear')
  async clearCart(@Request() req) {
    let userId = req.headers['x-user-id'];
    if (!userId) {
      const user = await this.cartService['prisma'].user.findFirst({ where: { role: 'CLIENT' } });
      if (!user) throw new Error('No user found');
      userId = user.id.toString();
    }
    return this.cartService.clearCart(userId);
  }
}
