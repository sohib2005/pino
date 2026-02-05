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
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // ============= PUBLIC ROUTES =============
  @Get()
  getActiveTemplates() {
    return this.templatesService.getActiveTemplates();
  }

  // ============= ADMIN ROUTES =============
  @Get('admin')
  getAllTemplates() {
    return this.templatesService.getAllTemplates();
  }

  @Get('admin/:id')
  getTemplateById(@Param('id', ParseIntPipe) id: number) {
    return this.templatesService.getTemplateById(id);
  }

  @Post('admin')
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(dto);
  }

  @Patch('admin/:id')
  updateTemplate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.updateTemplate(id, dto);
  }

  @Delete('admin/:id')
  deleteTemplate(@Param('id', ParseIntPipe) id: number) {
    return this.templatesService.deleteTemplate(id);
  }

  @Post('admin/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/templates',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.png';
          callback(null, `template-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 30 * 1024 * 1024,
      },
    }),
  )
  uploadTemplate(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imagePath = `/uploads/templates/${file.filename}`;
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protoHeader = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol;
    const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;
    const imageUrl = host ? `${protocol}://${host}${imagePath}` : `http://localhost:3001${imagePath}`;

    return {
      imageUrl,
      imagePath,
      filename: file.filename,
    };
  }
}
