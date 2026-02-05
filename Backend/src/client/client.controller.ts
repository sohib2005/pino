import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { LoginDto } from './dto/login.dto';

@Controller('/client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Get()
  async getAllClients() {
    try {
      const clients = await this.clientService.getAllClients();
      return { clients };
    } catch (error) {
      throw new BadRequestException('Erreur lors de la récupération des clients');
    }
  }

  @Get(':id')
  async getClientById(@Param('id') id: string) {
    try {
      const client = await this.clientService.getClientById(id);
      return { client };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la récupération du client');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClient(@Body() createClientDto: CreateClientDto) {
    if (!createClientDto.phoneNumber) {
      throw new BadRequestException('Le numéro de téléphone est requis');
    }

    try {
      const client = await this.clientService.createClient(createClientDto);
      return {
        message: 'Compte créé avec succès',
        client,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException(error.message || 'Erreur lors de la création du compte');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    if (!loginDto.phoneNumber || !loginDto.password) {
      throw new BadRequestException('Numéro de téléphone et mot de passe requis');
    }

    try {
      const client = await this.clientService.login(loginDto.phoneNumber, loginDto.password);
      return {
        message: 'Connexion réussie',
        client,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la connexion');
    }
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateClient(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    try {
      const client = await this.clientService.updateClient(id, updateClientDto);
      return {
        message: 'Client mis à jour avec succès',
        client,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la mise à jour du client');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteClient(@Param('id') id: string) {
    try {
      await this.clientService.deleteClient(id);
      return {
        message: 'Client supprimé avec succès',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la suppression du client');
    }
  }
}
