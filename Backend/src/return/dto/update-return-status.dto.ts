import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReturnStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVE = 'APPROUVE',
  REFUSE = 'REFUSE',
  EN_TRAITEMENT = 'EN_TRAITEMENT',
  TRAITE = 'TRAITE',
}

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatus)
  status: ReturnStatus;

  @IsOptional()
  @IsString()
  adminComment?: string;
}
