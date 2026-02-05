import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SizeName, StockMovementType } from '@prisma/client';

interface CreateProductDto {
  code?: string; // Optional since it will be auto-generated
  name: string;
  description?: string;
  color: string;
  price: number;
  images?: Array<{ url: string; viewType: 'AVANT' | 'DOS' | 'COTE' }>; // Array of images with viewType
  categoryId: number;
  isActive?: boolean;
  // Fields for variants - array of sizes with stock
  sizes: Array<{ size: string; stock: number }>;
}

interface UpdateProductDto {
  name?: string;
  description?: string;
  color?: string;
  price?: number;
  images?: Array<{ url: string; viewType: 'AVANT' | 'DOS' | 'COTE' }>;
  categoryId?: number;
  isActive?: boolean;
}

interface CreateVariantDto {
  productId: bigint;
  sizeId: number;
  sku: string;
  stock: number;
}

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  // ============= PRODUCTS =============
  async getAllProducts(categoryId?: number, color?: string, includeInactive: boolean = false, trash: boolean = false) {
    const where: any = trash ? { isDeleted: true } : { isDeleted: false };
    
    if (!includeInactive && !trash) {
      where.isActive = true;
    }
    
    if (categoryId) where.categoryId = categoryId;
    if (color) where.color = color;

    return this.prisma.product.findMany({
      where,
      include: {
        category: true,
        images: {
          orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
        },
        variants: {
          include: {
            size: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProductById(id: number | bigint) {
    const product = await this.prisma.product.findUnique({
      where: { id: BigInt(id) },
      include: {
        category: true,
        images: {
          orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
        },
        variants: {
          include: {
            size: true,
            movements: {
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async getProductByCode(code: string) {
    const product = await this.prisma.product.findUnique({
      where: { code },
      include: {
        category: true,
        variants: {
          include: {
            size: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with code ${code} not found`);
    }

    return product;
  }

  async createProduct(dto: CreateProductDto) {
    // Get category to extract code
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (!category.code) {
      throw new NotFoundException('Category has no code');
    }

    // Extract category code after validation
    const categoryCode: string = category.code;

    // Count existing products in this category to generate next number
    const productCount = await this.prisma.product.count({
      where: { categoryId: dto.categoryId },
    });

    // Generate product code: CategoryCode + Number (e.g., E01, E02, H01, H02)
    const productNumber = (productCount + 1).toString().padStart(2, '0');
    const productCode = `${categoryCode}${productNumber}`;

    // Prepare variants data for all selected sizes
    const variantsData: Array<{ sizeId: number; sku: string; stock: number }> = [];
    for (const sizeData of dto.sizes) {
      // Find size by name
      const size = await this.prisma.size.findUnique({
        where: { name: sizeData.size as SizeName },
      });

      if (!size) {
        throw new NotFoundException(`Size ${sizeData.size} not found`);
      }

      // Generate SKU: ProductCode-SizeName (e.g., E01-M, E01-L)
      const sku = `${productCode}-${sizeData.size}`;

      variantsData.push({
        sizeId: size.id,
        sku: sku,
        stock: sizeData.stock,
      });
    }

    // Create product with all variants in a transaction
    const product = await this.prisma.product.create({
      data: {
        code: productCode,
        name: dto.name,
        description: dto.description,
        color: dto.color,
        price: dto.price,
        categoryId: dto.categoryId,
        isActive: dto.isActive ?? true,
        variants: {
          create: variantsData,
        },
        images: dto.images ? {
          create: dto.images.filter(img => img.url && img.url.trim()).map((img, index) => ({
            imageUrl: img.url.trim(),
            viewType: img.viewType || 'AVANT',
            order: index,
          })),
        } : undefined,
      },
      include: {
        category: true,
        variants: {
          include: {
            size: true,
          },
        },
        images: {
          orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
        },
      },
    });

    return product;
  }

  async updateProduct(id: number | bigint, dto: UpdateProductDto) {
    try {
      const productId = BigInt(id);
      
      // Build update data object with only defined values
      const updateData: any = {};
      
      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.color !== undefined) updateData.color = dto.color;
      if (dto.price !== undefined) updateData.price = dto.price;
      if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      // Update in a transaction if images are provided
      if (dto.images && dto.images.length > 0) {
        return await this.prisma.$transaction(async (prisma) => {
          // Delete existing images
          await prisma.productImage.deleteMany({
            where: { productId },
          });

          // Create new images with viewType
          const validImages = (dto.images || []).filter(img => img.url && img.url.trim());
          if (validImages.length > 0) {
            await prisma.productImage.createMany({
              data: validImages.map((img, index) => ({
                productId,
                imageUrl: img.url.trim(),
                viewType: img.viewType || 'AVANT',
                order: index,
              })),
            });
          }

          // Update product
          return await prisma.product.update({
            where: { id: productId },
            data: updateData,
            include: {
              category: true,
              images: {
                orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
              },
              variants: {
                include: {
                  size: true,
                },
              },
            },
          });
        });
      }

      // Simple update without images
      return await this.prisma.product.update({
        where: { id: productId },
        data: updateData,
        include: {
          category: true,
          images: {
            orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
          },
          variants: {
            include: {
              size: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  // ============= DELETION SYSTEM (TRASH / HISTORY) =============
  
  /**
   * DELETE /products/:id
   * Initial delete request - either hard delete or move to trash
   */
  async deleteProduct(id: number | bigint, adminId?: string) {
    const productId = BigInt(id);

    return await this.prisma.$transaction(async (prisma) => {
      // Get all variant IDs
      const variants = await prisma.productVariant.findMany({
        where: { productId },
        select: { id: true },
      });

      const variantIds = variants.map((v) => v.id);

      // Check if product is used in orders or returns
      const usageCheck = await prisma.productVariant.findFirst({
        where: {
          productId,
          OR: [
            { orderItems: { some: {} } },
            { customOrderItems: { some: {} } },
            { returnItemsNew: { some: {} } },
          ],
        },
        select: { id: true },
      });

      // MOVE TO TRASH: Product is used in orders/returns
      if (usageCheck) {
        // Update product as deleted
        await prisma.product.update({
          where: { id: productId },
          data: {
            isDeleted: true,
            isActive: false,
            deletedAt: new Date(),
            deletedBy: adminId || null,
          },
        });

        // Create or update deletion request (only if adminId is provided)
        if (adminId) {
          await prisma.productDeletionRequest.upsert({
            where: { productId },
            create: {
              productId,
              createdBy: adminId,
              status: 'PENDING',
              reason: 'Produit utilisé dans des commandes',
            },
            update: {
              status: 'PENDING',
              createdAt: new Date(),
              createdBy: adminId,
            },
          });
        }

        // Remove from carts
        if (variantIds.length > 0) {
          await prisma.cartItem.deleteMany({
            where: { variantId: { in: variantIds } },
          });
        }

        return {
          action: 'moved_to_trash',
          message: 'Produit déplacé vers l\'historique de suppression',
        };
      }

      // HARD DELETE: Product not used anywhere
      if (variantIds.length > 0) {
        await prisma.stockMovement.deleteMany({
          where: { variantId: { in: variantIds } },
        });

        await prisma.cartItem.deleteMany({
          where: { variantId: { in: variantIds } },
        });
      }

      await prisma.product.delete({
        where: { id: productId },
      });

      return {
        action: 'deleted',
        message: 'Produit supprimé avec succès',
      };
    });
  }

  /**
   * GET /admin/products?trash=true
   * Get products in trash with deletion info
   * Excludes products permanently deleted (status='DELETED')
   */
  async getTrashProducts() {
    return this.prisma.product.findMany({
      where: { 
        isDeleted: true,
        // Only show products still pending in trash
        // Don't show permanently deleted ones (status='DELETED')
        OR: [
          { deletionRequest: { status: 'PENDING' } },
          { deletionRequest: null }, // No deletion request yet
        ],
      },
      include: {
        category: true,
        images: {
          orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
        },
        deletionRequest: {
          include: {
            admin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        variants: {
          include: {
            size: true,
            orderItems: {
              include: {
                order: {
                  select: { id: true, orderNumber: true, status: true },
                },
              },
            },
            customOrderItems: {
              include: {
                customOrder: {
                  select: { id: true, orderNumber: true, status: true },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * POST /admin/products/:id/restore
   * Restore product from trash
   */
  async restoreProduct(id: number | bigint) {
    const productId = BigInt(id);

    return await this.prisma.$transaction(async (prisma) => {
      // Update product
      await prisma.product.update({
        where: { id: productId },
        data: {
          isDeleted: false,
          isActive: true,
          deletedAt: null,
          deletedBy: null,
        },
      });

      // Update deletion request
      await prisma.productDeletionRequest.updateMany({
        where: { productId },
        data: { status: 'RESTORED' },
      });

      return {
        action: 'restored',
        message: 'Produit restauré avec succès',
      };
    });
  }

  /**
   * DELETE /admin/products/:id/permanent
   * Permanently delete product (checks order statuses)
   */
  async permanentDeleteProduct(id: number | bigint) {
    const productId = BigInt(id);

    return await this.prisma.$transaction(async (prisma) => {
      // Get all variants
      const variants = await prisma.productVariant.findMany({
        where: { productId },
        select: { id: true },
      });

      const variantIds = variants.map((v) => v.id);

      // Get all related orders with statuses
      const normalOrders = await prisma.order.findMany({
        where: {
          items: {
            some: {
              variantId: { in: variantIds },
            },
          },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      });

      const customOrders = await prisma.customOrder.findMany({
        where: {
          items: {
            some: {
              variantId: { in: variantIds },
            },
          },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
        },
      });

      // Check if any orders are EN_ATTENTE or EN_COURS
      const blockingOrders = [
        ...normalOrders.filter((o) => o.status === 'EN_ATTENTE' || o.status === 'EN_COURS' || o.status === 'LIVRE'),
        ...customOrders.filter((o) => o.status === 'EN_ATTENTE' || o.status === 'EN_COURS' || o.status === 'LIVRE'),
      ];

      if (blockingOrders.length > 0) {
        return {
          action: 'blocked',
          message: 'Produit lié à des commandes en cours',
          blockingOrders: blockingOrders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
          })),
          options: ['delete_orders_and_product', 'keep_in_trash'],
        };
      }

      // All orders are LIVRE or ANNULE - safe to "delete"
      // NOTE: We cannot actually DELETE from DB because of foreign key constraints.
      // ProductVariant has onDelete: Restrict from OrderItem, StockMovement, etc.
      // Even if orders are delivered, we must keep variants for order history integrity.
      
      // SOLUTION: Mark as permanently deleted but keep in database
      
      // Step 1: Delete cart items (these can be safely removed)
      if (variantIds.length > 0) {
        await prisma.cartItem.deleteMany({
          where: { variantId: { in: variantIds } },
        });
      }

      // Step 2: Delete return items with newVariantId references only
      if (variantIds.length > 0) {
        await prisma.returnItem.deleteMany({
          where: {
            newVariantId: { in: variantIds },
          },
        });
      }

      // Step 3: Mark deletion request as DELETED (permanently removed from trash UI)
      await prisma.productDeletionRequest.updateMany({
        where: { productId },
        data: { 
          status: 'DELETED',
          reason: 'Produit supprimé définitivement (conservé pour historique des commandes)',
        },
      });

      // Step 4: Ensure product stays soft-deleted and inactive
      await prisma.product.update({
        where: { id: productId },
        data: {
          isDeleted: true,
          isActive: false,
        },
      });

      return {
        action: 'deleted_permanently',
        message: 'Produit supprimé définitivement',
      };
    });
  }

  /**
   * DELETE /admin/products/:id/permanent-with-orders
   * Force delete product and all related orders
   */
  async forceDeleteProductWithOrders(id: number | bigint) {
    const productId = BigInt(id);

    return await this.prisma.$transaction(async (prisma) => {
      // Get all variants
      const variants = await prisma.productVariant.findMany({
        where: { productId },
        select: { id: true },
      });

      const variantIds = variants.map((v) => v.id);

      // Get all order IDs to delete
      const orderItems = await prisma.orderItem.findMany({
        where: { variantId: { in: variantIds } },
        select: { orderId: true },
      });

      const customOrderItems = await prisma.customOrderItem.findMany({
        where: { variantId: { in: variantIds } },
        select: { customOrderId: true },
      });

      const orderIds = [...new Set(orderItems.map((oi) => oi.orderId))];
      const customOrderIds = [...new Set(customOrderItems.map((coi) => coi.customOrderId))];

      // Delete return items
      await prisma.returnItem.deleteMany({
        where: {
          OR: [
            {
              orderItem: {
                variantId: { in: variantIds },
              },
            },
            {
              customOrderItem: {
                variantId: { in: variantIds },
              },
            },
          ],
        },
      });

      // Delete returns linked to these orders
      await prisma.return.deleteMany({
        where: {
          OR: [{ orderId: { in: orderIds } }, { customOrderId: { in: customOrderIds } }],
        },
      });

      // Delete orders (cascades order items)
      await prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });

      // Delete custom orders (cascades custom order items)
      await prisma.customOrder.deleteMany({
        where: { id: { in: customOrderIds } },
      });

      // Delete cart items
      await prisma.cartItem.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      // Delete stock movements
      await prisma.stockMovement.deleteMany({
        where: { variantId: { in: variantIds } },
      });

      // Delete product (cascades images and variants)
      await prisma.product.delete({
        where: { id: productId },
      });

      // Delete deletion request
      await prisma.productDeletionRequest.deleteMany({
        where: { productId },
      });

      return {
        action: 'deleted_orders_and_product',
        message: `Produit et ${orderIds.length + customOrderIds.length} commande(s) supprimés`,
        deletedOrders: orderIds.length,
        deletedCustomOrders: customOrderIds.length,
      };
    });
  }

  // ============= VARIANTS =============
  async getVariantById(id: number | bigint) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: BigInt(id) },
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
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${id} not found`);
    }

    return variant;
  }

  async createVariant(dto: CreateVariantDto) {
    return this.prisma.productVariant.create({
      data: {
        productId: dto.productId,
        sizeId: dto.sizeId,
        sku: dto.sku,
        stock: dto.stock,
      },
      include: {
        product: true,
        size: true,
      },
    });
  }

  async updateVariantStock(variantId: number | bigint, newStock: number, reason?: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: BigInt(variantId) },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    const difference = newStock - variant.stock;
    const type: StockMovementType = difference > 0 ? StockMovementType.IN : StockMovementType.OUT;

    // Only create stock movement if there's a difference
    if (difference !== 0) {
      await this.prisma.stockMovement.create({
        data: {
          variantId: BigInt(variantId),
          quantity: Math.abs(difference),
          type,
          reason: reason || 'Ajustement manuel',
        },
      });
    }

    // Update to the absolute new stock value
    return this.prisma.productVariant.update({
      where: { id: BigInt(variantId) },
      data: {
        stock: newStock,
      },
      include: {
        product: true,
        size: true,
      },
    });
  }

  async getVariantStock(variantId: number | bigint) {
    return this.getVariantById(variantId);
  }

  // ============= UTILITY =============
  async getAvailableColors() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      select: { color: true },
      distinct: ['color'],
    });
    return products.map(p => p.color);
  }

  async getAvailableSizes() {
    const sizes = await this.prisma.size.findMany({
      orderBy: { id: 'asc' },
    });
    return sizes.map(s => s.name);
  }

  async getProductsByCategory(categoryId: number) {
    return this.prisma.product.findMany({
      where: { 
        categoryId,
        isActive: true 
      },
      include: {
        category: true,
        images: {
          orderBy: [{ viewType: 'asc' }, { order: 'asc' }],
        },
        variants: {
          include: {
            size: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }
}
