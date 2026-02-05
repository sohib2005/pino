import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, Prisma, StockMovementType } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async createOrder(
    userId: string,
    data: {
      address: string;
      phoneNumber: string;
      notes?: string;
    },
  ) {
    // Get user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            personalization: true,
            variant: {
              include: {
                product: true,
                size: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Le panier est vide');
    }

    // Calculate total amount
    let totalAmount = new Prisma.Decimal(0);
    cart.items.forEach((item) => {
      totalAmount = totalAmount.add(
        item.variant.product.price.mul(new Prisma.Decimal(item.quantity)),
      );
    });

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order with transaction
    const order = await this.prisma.$transaction(async (prisma) => {
      // Step 1+2: decrement stock safely (only if enough stock)
      for (const item of cart.items) {
        const updated = await prisma.productVariant.updateMany({
          where: {
            id: item.variantId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        if (updated.count === 0) {
          throw new BadRequestException(`Stock insuffisant pour ${item.variant.sku}`);
        }

        // Step 3: Record stock movement
        await prisma.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            type: StockMovementType.OUT,
            reason: item.personalizationId
              ? `Order ${orderNumber} - personalized tshirt`
              : `Order ${orderNumber}`,
          },
        });
      }

      // Create order
      const newOrder = await prisma.order.create({
        data: {
          userId,
          orderNumber,
          status: OrderStatus.EN_ATTENTE,
          totalAmount,
          address: data.address,
          phoneNumber: data.phoneNumber,
          notes: data.notes,
          items: {
            create: cart.items.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.variant.product.price,
              totalPrice: item.variant.product.price.mul(new Prisma.Decimal(item.quantity)),
              personalizationId: item.personalizationId ?? undefined,
            })),
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
                    },
                  },
                  size: true,
                },
              },
            },
          },
        },
      });

      // Clear cart
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    return order;
  }

  async getOrders(userId: string) {
    return this.prisma.order.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getOrderById(userId: string, orderId: string) {
    return this.prisma.order.findFirst({
      where: { id: orderId, userId },
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

  async getAllOrders() {
    return this.prisma.order.findMany({
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
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: {
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
        },
      },
    });
  }

  async cancelOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new Error('Commande non trouvée');
    }

    if (order.status === OrderStatus.LIVRE) {
      throw new Error('Impossible d\'annuler une commande déjà livrée');
    }

    // Use transaction to restore stock
    return this.prisma.$transaction(async (prisma) => {
      // Restore stock
      for (const item of order.items) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        // Record stock movement
        await prisma.stockMovement.create({
          data: {
            variantId: item.variantId,
            quantity: item.quantity,
            type: StockMovementType.IN,
            reason: `Annulation commande ${order.orderNumber}`,
          },
        });
      }

      // Update status
      return prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.ANNULE },
      });
    });
  }

  async createGuestOrder(data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    notes?: string;
    items: Array<{
      variantId: string;
      quantity: number;
    }>;
  }) {
    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new Error('La commande doit contenir au moins un article');
    }

    // Get all variants and validate stock
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: {
          in: data.items.map(item => BigInt(item.variantId)),
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        size: true,
      },
    });

    if (variants.length !== data.items.length) {
      throw new Error('Certains articles n\'existent pas');
    }

    // Check stock for all items
    for (const item of data.items) {
      const variant = variants.find(v => v.id === BigInt(item.variantId));
      if (!variant) {
        throw new Error(`Article non trouvé: ${item.variantId}`);
      }
      if (variant.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${variant.sku}`);
      }
    }

    // Calculate total amount
    let totalAmount = new Prisma.Decimal(0);
    data.items.forEach((item) => {
      const variant = variants.find(v => v.id === BigInt(item.variantId))!;
      totalAmount = totalAmount.add(
        variant.product.price.mul(new Prisma.Decimal(item.quantity)),
      );
    });

    // Generate unique order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create temporary guest user or find existing one by phone
    let guestUser = await this.prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (!guestUser) {
      guestUser = await this.prisma.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          address: data.address,
          role: 'CLIENT',
          email: null,
          password: null,
        },
      });
    }

    // Create order with transaction
    const order = await this.prisma.$transaction(async (prisma) => {
      // Create order
      const newOrder = await prisma.order.create({
        data: {
          userId: guestUser.id,
          orderNumber,
          status: OrderStatus.EN_ATTENTE,
          totalAmount,
          address: data.address,
          phoneNumber: data.phoneNumber,
          notes: data.notes,
          items: {
            create: data.items.map((item) => {
              const variant = variants.find(v => v.id === BigInt(item.variantId))!;
              return {
                variantId: BigInt(item.variantId),
                quantity: item.quantity,
                unitPrice: variant.product.price,
                totalPrice: variant.product.price.mul(new Prisma.Decimal(item.quantity)),
              };
            }),
          },
        },
        include: {
          items: {
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
          },
        },
      });

      // Reduce stock for each item
      for (const item of data.items) {
        await prisma.productVariant.update({
          where: { id: BigInt(item.variantId) },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        // Record stock movement
        await prisma.stockMovement.create({
          data: {
            variantId: BigInt(item.variantId),
            quantity: item.quantity,
            type: StockMovementType.OUT,
            reason: `Commande rapide ${orderNumber}`,
          },
        });
      }

      return newOrder;
    });

    return order;
  }
}
