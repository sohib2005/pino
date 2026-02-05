import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonalizationDto } from './personalization.dto';
import { ImageViewType } from '@prisma/client';

@Injectable()
export class PersonalizationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePersonalizationDto) {
    if (!dto.previewUrl || !dto.printUrl) {
      throw new BadRequestException('previewUrl and printUrl are required');
    }

    return this.prisma.personalization.create({
      data: {
        viewType: dto.viewType ?? ImageViewType.AVANT,
        designJson: dto.designJson ?? undefined,
        previewUrl: dto.previewUrl,
        printUrl: dto.printUrl,
      },
    });
  }

  async getById(id: string) {
    return this.prisma.personalization.findUnique({ where: { id } });
  }
}
