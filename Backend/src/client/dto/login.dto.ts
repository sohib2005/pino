import { IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Le numéro de téléphone est requis' })
  @Matches(/^[0-9]{8}$/, { 
    message: 'Le numéro de téléphone doit contenir exactement 8 chiffres' 
  })
  phoneNumber: string;

  @IsString({ message: 'Le mot de passe est requis' })
  password: string;
}
