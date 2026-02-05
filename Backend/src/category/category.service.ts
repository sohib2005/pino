import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateCategoryDto {
  name: string;
  description?: string;
}

interface UpdateCategoryDto {
  name?: string;
  description?: string;
}

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async getAllCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(id: number) {
    return this.prisma.category.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            variants: {
              include: {
                size: true,
              },
            },
          },
        },
      },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: dto,
    });
  }

  async updateCategory(id: number, dto: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: number) {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
