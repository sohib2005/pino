import { IsString, IsEmail, IsOptional, Matches, MinLength } from 'class-validator';

export class UpdateAnimateurDto {
  @IsOptional()
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  lastName?: string;

  @IsOptional()
  @Matches(/^[0-9]{8}$/, { 
    message: 'Le numéro de téléphone doit contenir exactement 8 chiffres' 
  })
  phoneNumber?: string;

  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email n\'est pas valide' })
  email?: string;

  @IsOptional()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password?: string;

  @IsOptional()
  @IsString({ message: 'Le nom de l\'hôtel doit être une chaîne de caractères' })
  hotelName?: string;

  @IsOptional()
  @IsString({ message: 'L\'adresse doit être une chaîne de caractères' })
  address?: string;
}
