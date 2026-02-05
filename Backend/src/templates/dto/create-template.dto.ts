import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsString()
  @MaxLength(500)
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  tags?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
