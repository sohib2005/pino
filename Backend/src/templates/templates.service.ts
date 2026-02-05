import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async getActiveTemplates() {
    return this.prisma.albumTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllTemplates() {
    return this.prisma.albumTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTemplateById(id: number) {
    const template = await this.prisma.albumTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async createTemplate(dto: CreateTemplateDto) {
    return this.prisma.albumTemplate.create({
      data: {
        name: dto.name,
        imageUrl: dto.imageUrl,
        tags: dto.tags,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateTemplate(id: number, dto: UpdateTemplateDto) {
    await this.getTemplateById(id);

    return this.prisma.albumTemplate.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteTemplate(id: number) {
    await this.getTemplateById(id);

    await this.prisma.albumTemplate.delete({
      where: { id },
    });

    return { message: 'Template deleted successfully' };
  }
}
