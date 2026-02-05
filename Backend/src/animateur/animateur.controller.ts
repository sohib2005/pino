import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { AnimateurService } from './animateur.service';
import { CreateAnimateurDto } from './dto/create-animateur.dto';
import { UpdateAnimateurDto } from './dto/update-animateur.dto';

@Controller('animateurs')
export class AnimateurController {
  constructor(private readonly animateurService: AnimateurService) {}

  @Get()
  async getAllAnimateurs() {
    try {
      const animateurs = await this.animateurService.getAllAnimateurs();
      return { animateurs };
    } catch (error) {
      throw new BadRequestException('Erreur lors de la récupération des animateurs');
    }
  }

  @Get(':id')
  async getAnimateurById(@Param('id') id: string) {
    try {
      const animateur = await this.animateurService.getAnimateurById(id);
      return { animateur };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la récupération de l\'animateur');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAnimateur(@Body() createAnimateurDto: CreateAnimateurDto) {
    if (!createAnimateurDto.phoneNumber || !createAnimateurDto.password) {
      throw new BadRequestException('Numéro de téléphone et mot de passe requis');
    }

    try {
      const animateur = await this.animateurService.createAnimateur(createAnimateurDto);
      return {
        message: 'Compte animateur créé avec succès',
        animateur,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Erreur lors de la création du compte animateur');
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateAnimateur(@Param('id') id: string, @Body() updateAnimateurDto: UpdateAnimateurDto) {
    try {
      const animateur = await this.animateurService.updateAnimateur(id, updateAnimateurDto);
      return {
        message: 'Animateur mis à jour avec succès',
        animateur,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la mise à jour de l\'animateur');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteAnimateur(@Param('id') id: string) {
    try {
      await this.animateurService.deleteAnimateur(id);
      return {
        message: 'Animateur supprimé avec succès',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la suppression de l\'animateur');
    }
  }
}
