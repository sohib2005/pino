import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { UpdateReturnStatusDto } from './dto/update-return-status.dto';
import { ProcessReturnItemDto, ReturnAction } from './dto/process-return-item.dto';

@Injectable()
export class ReturnService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique return number
   */
  private async generateReturnNumber(): Promise<string> {
    const latest = await this.prisma.return.findFirst({
      select: { returnNumber: true },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (latest?.returnNumber) {
      const match = latest.returnNumber.match(/RET-(\d+)/);
      if (match && match[1]) {
        const parsed = Number(match[1]);
        if (Number.isFinite(parsed)) {
          nextNumber = parsed + 1;
        }
      } else {
        const count = await this.prisma.return.count();
        nextNumber = count + 1;
      }
    }

    let candidate = `RET-${String(nextNumber).padStart(6, '0')}`;
    // Ensure uniqueness if numbers got out of sync
    while (await this.prisma.return.findUnique({ where: { returnNumber: candidate } })) {
      nextNumber += 1;
      candidate = `RET-${String(nextNumber).padStart(6, '0')}`;
    }

    return candidate;
  }

  /**
   * Validate that either orderId or customOrderId is provided (but not both)
   */
  private validateOrderReference(orderId?: string, customOrderId?: string) {
    if (!orderId && !customOrderId) {
      throw new BadRequestException(
        'Either orderId or customOrderId must be provided',
      );
    }
    if (orderId && customOrderId) {
      throw new BadRequestException(
        'Cannot provide both orderId and customOrderId',
      );
    }
  }

  /**
   * Create a new return request
   */
  async createReturn(userId: string, createReturnDto: CreateReturnDto) {
    const { orderId, customOrderId, reason, userComment, items } =
      createReturnDto;

    this.validateOrderReference(orderId, customOrderId);

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('Veuillez sélectionner au moins un article');
    }

    // Validate order exists and belongs to user
    if (orderId) {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.userId !== userId) {
        throw new ForbiddenException('This order does not belong to you');
      }

      if (order.status !== 'LIVRE') {
        throw new BadRequestException(
          'Can only return items from delivered orders',
        );
      }

      // Validate items
      for (const item of items) {
        const orderItemId = Number(item.orderItemId);
        if (!Number.isInteger(orderItemId) || orderItemId <= 0) {
          throw new BadRequestException('orderItemId is required for regular orders');
        }

        const orderItem = order.items.find((oi) => oi.id === BigInt(orderItemId));
        if (!orderItem) {
          throw new BadRequestException(`Order item ${orderItemId} not found in this order`);
        }

        // Check quantity
        const alreadyReturned = await this.getReturnedQuantity(orderItemId, null);
        const availableForReturn = orderItem.quantity - alreadyReturned;

        if (item.quantityReturned > availableForReturn) {
          throw new BadRequestException(
            `Cannot return ${item.quantityReturned} units. Only ${availableForReturn} available for return`,
          );
        }

        // Check if there's already a pending return for this item
        const existingReturn = await this.prisma.returnItem.findFirst({
          where: {
            orderItemId: BigInt(orderItemId),
            return: {
              status: {
                in: ['EN_ATTENTE', 'APPROUVE', 'EN_TRAITEMENT'],
              },
            },
          },
        });

        if (existingReturn) {
          throw new BadRequestException(
            `Item ${item.orderItemId} already has a pending return request`,
          );
        }
      }
    } else if (customOrderId) {
      const customOrder = await this.prisma.customOrder.findUnique({
        where: { id: customOrderId },
        include: { items: true },
      });

      if (!customOrder) {
        throw new NotFoundException('Custom order not found');
      }

      if (customOrder.userId !== userId) {
        throw new ForbiddenException('This order does not belong to you');
      }

      if (customOrder.status !== 'LIVRE') {
        throw new BadRequestException(
          'Can only return items from delivered orders',
        );
      }

      // Validate items
      for (const item of items) {
        const customOrderItemId = Number(item.customOrderItemId);
        if (!Number.isInteger(customOrderItemId) || customOrderItemId <= 0) {
          throw new BadRequestException('customOrderItemId is required for custom orders');
        }

        const customOrderItem = customOrder.items.find(
          (coi) => coi.id === BigInt(customOrderItemId),
        );
        if (!customOrderItem) {
          throw new BadRequestException(
            `Custom order item ${customOrderItemId} not found in this order`,
          );
        }

        // Check quantity
        const alreadyReturned = await this.getReturnedQuantity(null, customOrderItemId);
        const availableForReturn = customOrderItem.quantity - alreadyReturned;

        if (item.quantityReturned > availableForReturn) {
          throw new BadRequestException(
            `Cannot return ${item.quantityReturned} units. Only ${availableForReturn} available for return`,
          );
        }

        // Check if there's already a pending return for this item
        const existingReturn = await this.prisma.returnItem.findFirst({
          where: {
            customOrderItemId: BigInt(customOrderItemId),
            return: {
              status: {
                in: ['EN_ATTENTE', 'APPROUVE', 'EN_TRAITEMENT'],
              },
            },
          },
        });

        if (existingReturn) {
          throw new BadRequestException(
            `Item ${item.customOrderItemId} already has a pending return request`,
          );
        }
      }
    }

    // Create return
    const returnNumber = await this.generateReturnNumber();

    return await this.prisma.return.create({
      data: {
        returnNumber,
        userId,
        orderId,
        customOrderId,
        reason,
        userComment,
        status: 'EN_ATTENTE',
        items: {
          create: items.map((item) => ({
            orderItemId: item.orderItemId ? BigInt(item.orderItemId) : null,
            customOrderItemId: item.customOrderItemId
              ? BigInt(item.customOrderItemId)
              : null,
            quantityReturned: item.quantityReturned,
          })),
        },
      },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
            customOrderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
          },
        },
        order: true,
        customOrder: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get total quantity already returned for an item
   */
  private async getReturnedQuantity(
    orderItemId: number | null,
    customOrderItemId: number | null,
  ): Promise<number> {
    const where: any = {};
    if (orderItemId) {
      where.orderItemId = BigInt(orderItemId);
    } else if (customOrderItemId) {
      where.customOrderItemId = BigInt(customOrderItemId);
    }

    const returns = await this.prisma.returnItem.findMany({
      where: {
        ...where,
        return: {
          status: {
            not: 'REFUSE',
          },
        },
      },
    });

    return returns.reduce((sum, r) => sum + r.quantityReturned, 0);
  }

  /**
   * Get all returns (admin only)
   */
  async getAllReturns(status?: string) {
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }

    return await this.prisma.return.findMany({
      where,
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
            customOrderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
          },
        },
        order: true,
        customOrder: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get returns for a specific user (animateur/client)
   */
  async getMyReturns(userId: string) {
    return await this.prisma.return.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
            customOrderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
          },
        },
        order: true,
        customOrder: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get return by ID
   */
  async getReturnById(id: string) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
            customOrderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
            newVariant: {
              include: {
                product: true,
                size: true,
              },
            },
          },
        },
        order: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
        customOrder: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                email: true,
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
            email: true,
            role: true,
          },
        },
      },
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found');
    }

    return returnRecord;
  }

  /**
   * Update return status (admin only)
   */
  async updateReturnStatus(
    id: string,
    updateStatusDto: UpdateReturnStatusDto,
  ) {
    const returnRecord = await this.prisma.return.findUnique({
      where: { id },
    });

    if (!returnRecord) {
      throw new NotFoundException('Return not found');
    }

    if (returnRecord.status === 'TRAITE') {
      throw new BadRequestException('Cannot modify a processed return');
    }

    const data: any = {
      status: updateStatusDto.status,
      adminComment: updateStatusDto.adminComment,
    };

    if (updateStatusDto.status === 'TRAITE') {
      data.processedAt = new Date();
    }

    return await this.prisma.return.update({
      where: { id },
      data,
      include: {
        items: {
          include: {
            orderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
            customOrderItem: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
          },
        },
        order: true,
        customOrder: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Process return item with action
   */
  async processReturnItem(processDto: ProcessReturnItemDto) {
    const returnItem = await this.prisma.returnItem.findUnique({
      where: { id: BigInt(processDto.returnItemId) },
      include: {
        return: true,
        orderItem: {
          include: {
            variant: true,
          },
        },
        customOrderItem: {
          include: {
            variant: true,
          },
        },
      },
    });

    if (!returnItem) {
      throw new NotFoundException('Return item not found');
    }

    if (returnItem.processed) {
      throw new BadRequestException('This return item has already been processed');
    }

    if (returnItem.return.status !== 'APPROUVE' && returnItem.return.status !== 'EN_TRAITEMENT') {
      throw new BadRequestException('Return must be approved before processing items');
    }

    // Process based on action
    const variant = returnItem.orderItem?.variant || returnItem.customOrderItem?.variant;

    if (!variant) {
      throw new NotFoundException('Product variant not found for return item');
    }

    switch (processDto.action) {
      case ReturnAction.REIMPRESSION:
        // Create production task (future implementation)
        // For now, just mark as processed
        break;

      case ReturnAction.CHANGEMENT_TAILLE:
        if (!processDto.newVariantId) {
          throw new BadRequestException('newVariantId is required for size change');
        }

        // Validate new variant exists
        const newVariant = await this.prisma.productVariant.findUnique({
          where: { id: BigInt(processDto.newVariantId) },
        });

        if (!newVariant) {
          throw new NotFoundException('New variant not found');
        }

        // Use transaction for stock movements
        await this.prisma.$transaction(async (tx) => {
          // OUT: Remove old variant from stock
          await tx.stockMovement.create({
            data: {
              variantId: variant.id,
              quantity: returnItem.quantityReturned,
              type: 'OUT',
              reason: 'RETURN_EXCHANGE - Size change',
            },
          });

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stock: {
                decrement: returnItem.quantityReturned,
              },
            },
          });

          // IN: Add new variant to stock
          await tx.stockMovement.create({
            data: {
              variantId: BigInt(processDto.newVariantId!),
              quantity: returnItem.quantityReturned,
              type: 'IN',
              reason: 'RETURN_EXCHANGE - Size change',
            },
          });

          await tx.productVariant.update({
            where: { id: BigInt(processDto.newVariantId!) },
            data: {
              stock: {
                increment: returnItem.quantityReturned,
              },
            },
          });
        });
        break;

      case ReturnAction.AVOIR:
        // Create credit record (future implementation)
        break;

      case ReturnAction.REMBOURSEMENT:
        if (!processDto.refundAmount) {
          throw new BadRequestException('refundAmount is required for refund');
        }
        // Process refund (future implementation with payment gateway)
        break;
    }

    // Update return item
    return await this.prisma.returnItem.update({
      where: { id: BigInt(processDto.returnItemId) },
      data: {
        action: processDto.action,
        newVariantId: processDto.newVariantId ? BigInt(processDto.newVariantId) : null,
        refundAmount: processDto.refundAmount,
        processed: true,
      },
      include: {
        orderItem: {
          include: {
            variant: {
              include: {
                product: true,
                size: true,
              },
            },
          },
        },
        customOrderItem: {
          include: {
            variant: {
              include: {
                product: true,
                size: true,
              },
            },
          },
        },
        newVariant: {
          include: {
            product: true,
            size: true,
          },
        },
      },
    });
  }

  /**
   * Get return statistics
   */
  async getReturnStats() {
    const total = await this.prisma.return.count();
    const enAttente = await this.prisma.return.count({
      where: { status: 'EN_ATTENTE' },
    });
    const approuve = await this.prisma.return.count({
      where: { status: 'APPROUVE' },
    });
    const enTraitement = await this.prisma.return.count({
      where: { status: 'EN_TRAITEMENT' },
    });
    const traite = await this.prisma.return.count({
      where: { status: 'TRAITE' },
    });
    const refuse = await this.prisma.return.count({
      where: { status: 'REFUSE' },
    });

    return {
      total,
      enAttente,
      approuve,
      enTraitement,
      traite,
      refuse,
    };
  }
}
