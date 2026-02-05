import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CarouselService } from './carousel.service';
import { CreateCarouselSlideDto } from './dto/create-carousel-slide.dto';
import { UpdateCarouselSlideDto } from './dto/update-carousel-slide.dto';
import { ReorderCarouselSlidesDto } from './dto/reorder-carousel-slides.dto';

@Controller('carousel')
export class CarouselController {
  constructor(private readonly carouselService: CarouselService) {}

  // ============= PUBLIC ROUTES =============
  
  /**
   * GET /carousel - Get active slides for homepage
   * Public endpoint
   */
  @Get()
  getActiveSlides() {
    return this.carouselService.getActiveSlides();
  }

  // ============= ADMIN ROUTES =============
  
  /**
   * GET /carousel/admin - Get all slides (admin)
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles('ADMIN') when auth is ready
   */
  @Get('admin')
  getAllSlides() {
    return this.carouselService.getAllSlides();
  }

  /**
   * PATCH /carousel/admin/reorder - Reorder slides (admin)
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles('ADMIN') when auth is ready
   */
  @Patch('admin/reorder')
  reorderSlides(@Body() dto: ReorderCarouselSlidesDto) {
    return this.carouselService.reorderSlides(dto);
  }

  /**
   * POST /carousel/admin/upload - Upload carousel image (admin)
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles('ADMIN') when auth is ready
   */
  @Post('admin/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/carousel',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `carousel-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 30 * 1024 * 1024, // 30MB
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    console.log('✅ Carousel image uploaded:', file.filename, 'Size:', file.size);

    const imagePath = `/uploads/carousel/${file.filename}`;
    const imageUrl = `http://localhost:3001${imagePath}`;

    return {
      imageUrl,
      imagePath,
      filename: file.filename,
    };
  }

  /**
   * GET /carousel/admin/:id - Get slide by ID (admin)
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles('ADMIN') when auth is ready
   */
  @Get('admin/:id')
  getSlideById(@Param('id', ParseIntPipe) id: number) {
    return this.carouselService.getSlideById(id);
  }

  /**
   * POST /carousel/admin - Create new slide (admin)
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles('ADMIN') when auth is ready
   */
  @Post('admin')
  createSlide(@Body() dto: CreateCarouselSlideDto) {
    return this.carouselService.createSlide(dto);
  }

  /**
   * PATCH /carousel/admin/:id - Update slide (admin)
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles('ADMIN') when auth is ready
   */
  @Patch('admin/:id')
  updateSlide(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCarouselSlideDto,
  ) {
    return this.carouselService.updateSlide(id, dto);
  }

  /**
   * DELETE /carousel/admin/:id - Delete slide (admin)
   * TODO: Add @UseGuards(JwtAuthGuard, RolesGuard) and @Roles('ADMIN') when auth is ready
   */
  @Delete('admin/:id')
  deleteSlide(@Param('id', ParseIntPipe) id: number) {
    return this.carouselService.deleteSlide(id);
  }
}
