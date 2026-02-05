import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientService {
  private prisma: PrismaClient;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  getHello(): string {
    return 'Client Apis is working!';
  }

  async createClient(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber: string;
    password?: string;
    address?: string;
    role?: Role;
  }) {
    // Check if phone number already exists
    const existingClient = await this.prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingClient) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    // Hash password if provided
    let hashedPassword: string | null = null;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // Create client
    const client = await this.prisma.user.create({
      data: {
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        email: data.email || null,
        phoneNumber: data.phoneNumber,
        password: hashedPassword,
        address: data.address || null,
        role: data.role || Role.CLIENT,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        // Don't return password
      },
    });

    return client;
  }

  async login(phoneNumber: string, password: string) {
    // Find client by phone number
    const client = await this.prisma.user.findUnique({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    if (!client) {
      throw new BadRequestException('Numéro de téléphone ou mot de passe incorrect');
    }

    if (!client.password) {
      throw new BadRequestException('Ce compte n\'a pas de mot de passe configuré');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, client.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Numéro de téléphone ou mot de passe incorrect');
    }

    // Return client without password
    const { password: _, ...clientWithoutPassword } = client;
    return clientWithoutPassword;
  }

  async getAllClients() {
    const clients = await this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return clients;
  }

  async getClientById(id: string) {
    const client = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
      },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    return client;
  }

  async updateClient(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    password?: string;
  }) {
    // Check if client exists
    const existingClient = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new NotFoundException('Client non trouvé');
    }

    // Check if phone number is being changed and if it's already used
    if (data.phoneNumber && data.phoneNumber !== existingClient.phoneNumber) {
      const phoneExists = await this.prisma.user.findUnique({
        where: { phoneNumber: data.phoneNumber },
      });
      
      if (phoneExists) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
      }
    }

    // Hash password if provided
    let hashedPassword: string | undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    // Update client
    const client = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
        ...(data.address !== undefined && { address: data.address }),
        ...(hashedPassword && { password: hashedPassword }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
      },
    });

    return client;
  }

  async deleteClient(id: string) {
    // Check if client exists
    const existingClient = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new NotFoundException('Client non trouvé');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Client supprimé avec succès' };
  }
}
