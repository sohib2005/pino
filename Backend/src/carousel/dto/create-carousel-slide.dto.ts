import { IsString, IsOptional, IsInt, IsBoolean, IsUrl, MaxLength } from 'class-validator';

export class CreateCarouselSlideDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  subtitle?: string;

  @IsString()
  @MaxLength(500)
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
