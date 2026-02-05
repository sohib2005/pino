import { IsArray, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class SlideOrderDto {
  @IsInt()
  id: number;

  @IsInt()
  order: number;
}

export class ReorderCarouselSlidesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlideOrderDto)
  slides: SlideOrderDto[];
}
