import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, TextLanguage, Prisma, Role } from '@prisma/client';

@Injectable()
export class CustomOrderService {
  constructor(private prisma: PrismaService) {}

  async createCustomOrder(
    userId: string,
    data: {
      hotelName?: string;
      notes?: string;
      items: Array<{
        variantId: number;
        printedName: string;
        textLanguage: TextLanguage;
        withDjerbaLogo: boolean;
        quantity: number;
      }>;
    },
  ) {
    // Verify user is ANIMATEUR
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== Role.ANIMATEUR) {
      throw new ForbiddenException('Seuls les animateurs peuvent créer des grandes commandes');
    }

    // Validate items
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('La commande doit contenir au moins un article');
    }

    // Get all variants and validate
    const variantIds = data.items.map(item => BigInt(item.variantId));
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds,
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

    if (variants.length !== new Set(variantIds).size) {
      throw new BadRequestException('Certaines variantes n\'existent pas');
    }

    // Calculate total amount
    let totalAmount = new Prisma.Decimal(0);
    data.items.forEach((item) => {
      const variant = variants.find(v => v.id === BigInt(item.variantId));
      if (variant) {
        totalAmount = totalAmount.add(
          variant.product.price.mul(new Prisma.Decimal(item.quantity)),
        );
      }
    });

    // Generate unique order number
    const orderNumber = `GC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create custom order
    const customOrder = await this.prisma.customOrder.create({
      data: {
        userId,
        orderNumber,
        status: OrderStatus.EN_ATTENTE,
        totalAmount,
        hotelName: data.hotelName,
        notes: data.notes,
        items: {
          create: data.items.map((item) => {
            const variant = variants.find(v => v.id === BigInt(item.variantId))!;
            return {
              variantId: BigInt(item.variantId),
              printedName: item.printedName,
              textLanguage: item.textLanguage,
              withDjerbaLogo: item.withDjerbaLogo,
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            address: true,
          },
        },
      },
    });

    return customOrder;
  }

  async getCustomOrders(userId: string) {
    return this.prisma.customOrder.findMany({
      where: { userId },
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getCustomOrderById(userId: string, orderId: string) {
    return this.prisma.customOrder.findFirst({
      where: { id: orderId, userId },
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

  async getAllCustomOrders() {
    return this.prisma.customOrder.findMany({
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
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            address: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateCustomOrderStatus(orderId: string, status: OrderStatus) {
    return this.prisma.customOrder.update({
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

  async cancelCustomOrder(userId: string, orderId: string) {
    const customOrder = await this.prisma.customOrder.findFirst({
      where: { id: orderId, userId },
    });

    if (!customOrder) {
      throw new NotFoundException('Commande non trouvée');
    }

    if (customOrder.status === OrderStatus.LIVRE) {
      throw new BadRequestException('Impossible d\'annuler une commande déjà livrée');
    }

    return this.prisma.customOrder.update({
      where: { id: orderId },
      data: { status: OrderStatus.ANNULE },
    });
  }
}
