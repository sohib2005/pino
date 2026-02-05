import { IsInt, IsEnum, IsOptional, IsNumber, Min } from 'class-validator';

export enum ReturnAction {
  REIMPRESSION = 'REIMPRESSION',
  CHANGEMENT_TAILLE = 'CHANGEMENT_TAILLE',
  AVOIR = 'AVOIR',
  REMBOURSEMENT = 'REMBOURSEMENT',
}

export class ProcessReturnItemDto {
  @IsInt()
  returnItemId: number;

  @IsEnum(ReturnAction)
  action: ReturnAction;

  @IsOptional()
  @IsInt()
  newVariantId?: number; // For CHANGEMENT_TAILLE

  @IsOptional()
  @IsNumber()
  @Min(0)
  refundAmount?: number; // For REMBOURSEMENT
}
