import { IsUUID, IsEnum, IsString, IsOptional, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReturnReason {
  ERREUR_IMPRESSION = 'ERREUR_IMPRESSION',
  MAUVAISE_TAILLE = 'MAUVAISE_TAILLE',
  MAUVAISE_LANGUE = 'MAUVAISE_LANGUE',
  PRODUIT_DEFECTUEUX = 'PRODUIT_DEFECTUEUX',
  AUTRE = 'AUTRE',
}

export class CreateReturnItemDto {
  @IsOptional()
  @IsInt()
  orderItemId?: number;

  @IsOptional()
  @IsInt()
  customOrderItemId?: number;

  @IsInt()
  @Min(1)
  quantityReturned: number;
}

export class CreateReturnDto {
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @IsOptional()
  @IsUUID()
  customOrderId?: string;

  @IsEnum(ReturnReason)
  reason: ReturnReason;

  @IsOptional()
  @IsString()
  userComment?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items: CreateReturnItemDto[];
}
