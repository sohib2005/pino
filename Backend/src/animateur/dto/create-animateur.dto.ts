import { IsString, IsEmail, IsOptional, Matches, MinLength } from 'class-validator';

export class CreateAnimateurDto {
  @IsString({ message: 'Le prénom est requis' })
  firstName: string;

  @IsString({ message: 'Le nom est requis' })
  lastName: string;

  @IsString({ message: 'Le numéro de téléphone est requis' })
  @Matches(/^[0-9]{8}$/, { 
    message: 'Le numéro de téléphone doit contenir exactement 8 chiffres' 
  })
  phoneNumber: string;

  @IsOptional()
  @IsEmail({}, { message: 'L\'adresse email n\'est pas valide' })
  email?: string;

  @IsString({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;

  @IsOptional()
  @IsString({ message: 'Le nom de l\'hôtel doit être une chaîne de caractères' })
  hotelName?: string;

  @IsOptional()
  @IsString({ message: 'L\'adresse doit être une chaîne de caractères' })
  address?: string;
}
