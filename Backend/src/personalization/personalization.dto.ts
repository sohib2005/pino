import { ImageViewType } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePersonalizationDto {
  @IsOptional()
  @IsEnum(ImageViewType)
  viewType?: ImageViewType;

  @IsOptional()
  designJson?: any;

  @IsString()
  @IsNotEmpty()
  previewUrl!: string;

  @IsString()
  @IsNotEmpty()
  printUrl!: string;
}
