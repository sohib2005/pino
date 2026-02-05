import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Request } from 'express';

@Controller('uploads')
export class UploadsController {
  /**
   * POST /uploads/personalized
   * Multipart file upload for personalization previews/prints.
   */
  @Post('personalized')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/personalizations',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname) || '.png';
          callback(null, `personalization-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new Error('Only image files are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  uploadPersonalized(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const imagePath = `/uploads/personalizations/${file.filename}`;

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protoHeader = (req.headers['x-forwarded-proto'] as string | undefined) ?? req.protocol;
    const protocol = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader;

    const url = host ? `${protocol}://${host}${imagePath}` : `http://localhost:3001${imagePath}`;

    return { url, path: imagePath };
  }
}
