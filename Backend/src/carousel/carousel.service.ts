import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarouselSlideDto } from './dto/create-carousel-slide.dto';
import { UpdateCarouselSlideDto } from './dto/update-carousel-slide.dto';
import { ReorderCarouselSlidesDto } from './dto/reorder-carousel-slides.dto';

@Injectable()
export class CarouselService {
  constructor(private prisma: PrismaService) {}

  // Get active slides for public homepage
  async getActiveSlides() {
    return this.prisma.carouselSlide.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  // Get all slides for admin (including inactive)
  async getAllSlides() {
    return this.prisma.carouselSlide.findMany({
      orderBy: { order: 'asc' },
    });
  }

  // Get single slide by ID
  async getSlideById(id: number) {
    const slide = await this.prisma.carouselSlide.findUnique({
      where: { id },
    });

    if (!slide) {
      throw new NotFoundException(`Slide with ID ${id} not found`);
    }

    return slide;
  }

  // Create new slide
  async createSlide(dto: CreateCarouselSlideDto) {
    return this.prisma.carouselSlide.create({
      data: {
        title: dto.title,
        subtitle: dto.subtitle,
        imageUrl: dto.imageUrl,
        link: dto.link,
        order: dto.order ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  // Update slide
  async updateSlide(id: number, dto: UpdateCarouselSlideDto) {
    // Check if slide exists
    await this.getSlideById(id);

    return this.prisma.carouselSlide.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.link !== undefined && { link: dto.link }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  // Delete slide
  async deleteSlide(id: number) {
    // Check if slide exists
    await this.getSlideById(id);

    await this.prisma.carouselSlide.delete({
      where: { id },
    });

    return { message: 'Slide deleted successfully' };
  }

  // Reorder slides
  async reorderSlides(dto: ReorderCarouselSlidesDto) {
    // Use transaction to update all orders atomically
    const updatePromises = dto.slides.map((slide) =>
      this.prisma.carouselSlide.update({
        where: { id: slide.id },
        data: { order: slide.order },
      })
    );

    await this.prisma.$transaction(updatePromises);

    return { message: 'Slides reordered successfully' };
  }
}
