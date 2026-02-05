import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            personalization: true,
            variant: {
              include: {
                product: {
                  include: {
                    category: true,
                    images: {
                      orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
                    },
                  },
                },
                size: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
          items: {
            create: [],
          },
        },
        include: {
          items: {
            include: {
              personalization: true,
              variant: {
                include: {
                  product: {
                    include: {
                      category: true,
                      images: {
                        orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
                      },
                    },
                  },
                  size: true,
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addToCart(userId: string, variantId: number, quantity: number, personalizationId?: string) {
    const cart = await this.getCart(userId);

    // Check available stock
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: BigInt(variantId) },
      include: {
        product: true,
        size: true,
      },
    });

    if (!variant) {
      throw new BadRequestException('Variante de produit non trouvée');
    }

    if (variant.stock < quantity) {
      throw new BadRequestException('Stock insuffisant');
    }

    const currentQtyAgg = await this.prisma.cartItem.aggregate({
      where: { cartId: cart.id, variantId: BigInt(variantId) },
      _sum: { quantity: true },
    });
    const currentQty = currentQtyAgg._sum.quantity ?? 0;
    if (variant.stock < currentQty + quantity) {
      throw new BadRequestException('Stock insuffisant');
    }

    if (personalizationId) {
      const existingPersonalized = await this.prisma.cartItem.findFirst({
        where: { cartId: cart.id, personalizationId },
      });

      if (existingPersonalized) {
        if (existingPersonalized.variantId !== BigInt(variantId)) {
          throw new BadRequestException('Personnalisation déjà utilisée pour une autre variante');
        }

        return this.prisma.cartItem.update({
          where: { id: existingPersonalized.id },
          data: { quantity: existingPersonalized.quantity + quantity },
          include: {
            personalization: true,
            variant: {
              include: {
                product: {
                  include: {
                    category: true,
                    images: {
                      orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
                    },
                  },
                },
                size: true,
              },
            },
          },
        });
      }
    }

    const existingNonPersonalized = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        variantId: BigInt(variantId),
        personalizationId: null,
      },
    });

    if (existingNonPersonalized && !personalizationId) {
      return this.prisma.cartItem.update({
        where: { id: existingNonPersonalized.id },
        data: { quantity: existingNonPersonalized.quantity + quantity },
        include: {
          personalization: true,
          variant: {
            include: {
              product: {
                include: {
                  category: true,
                  images: {
                    orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
                  },
                },
              },
              size: true,
            },
          },
        },
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        variantId: BigInt(variantId),
        quantity,
        personalizationId,
      },
      include: {
        personalization: true,
        variant: {
          include: {
            product: {
              include: {
                category: true,
                images: {
                  orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
                },
              },
            },
            size: true,
          },
        },
      },
    });
  }

  async updateCartItem(userId: string, itemId: number, quantity: number) {
    const cart = await this.getCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: BigInt(itemId), cartId: cart.id },
      include: { 
        variant: {
          include: {
            product: true,
            size: true,
          },
        },
      },
    });

    if (!item) {
      throw new BadRequestException('Article non trouvé dans le panier');
    }

    if (item.variant.stock < quantity) {
      throw new BadRequestException('Stock insuffisant');
    }

    if (quantity <= 0) {
      return this.prisma.cartItem.delete({ where: { id: BigInt(itemId) } });
    }

    return this.prisma.cartItem.update({
      where: { id: BigInt(itemId) },
      data: { quantity },
      include: {
        variant: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
            size: true,
          },
        },
      },
    });
  }

  async removeFromCart(userId: string, itemId: number) {
    const cart = await this.getCart(userId);
    const item = await this.prisma.cartItem.findFirst({
      where: { id: BigInt(itemId), cartId: cart.id },
    });

    if (!item) {
      throw new BadRequestException('Article non trouvé dans le panier');
    }

    return this.prisma.cartItem.delete({ where: { id: BigInt(itemId) } });
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
    return { message: 'Panier vidé avec succès' };
  }
}
