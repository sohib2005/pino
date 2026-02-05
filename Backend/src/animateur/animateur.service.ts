import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AnimateurService {
  private prisma: PrismaClient;

  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async createAnimateur(data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    password: string;
    hotelName?: string;
    address?: string;
  }) {
    // Check if phone number already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException('Ce numéro de téléphone est déjà utilisé');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create animateur
    const animateur = await this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        email: data.email || null,
        password: hashedPassword,
        address: data.hotelName ? `Hôtel ${data.hotelName}` : data.address || null,
        role: Role.ANIMATEUR,
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

    return animateur;
  }

  async getAllAnimateurs() {
    const animateurs = await this.prisma.user.findMany({
      where: { role: Role.ANIMATEUR },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
        _count: {
          select: {
            customOrders: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });

    return animateurs;
  }

  async getAnimateurById(id: string) {
    const animateur = await this.prisma.user.findUnique({
      where: { id, role: Role.ANIMATEUR },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        address: true,
        role: true,
        customOrders: {
          include: {
            items: {
              include: {
                variant: {
                  include: {
                    product: true,
                    size: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!animateur) {
      throw new NotFoundException('Animateur non trouvé');
    }

    return animateur;
  }

  async updateAnimateur(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    hotelName?: string;
    address?: string;
    password?: string;
  }) {
    const animateur = await this.prisma.user.findUnique({
      where: { id, role: Role.ANIMATEUR },
    });

    if (!animateur) {
      throw new NotFoundException('Animateur non trouvé');
    }

    let hashedPassword: string | undefined = undefined;
    if (data.password) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const updatedAnimateur = await this.prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        address: data.hotelName ? `Hôtel ${data.hotelName}` : data.address,
        password: hashedPassword,
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

    return updatedAnimateur;
  }

  async deleteAnimateur(id: string) {
    const animateur = await this.prisma.user.findUnique({
      where: { id, role: Role.ANIMATEUR },
    });

    if (!animateur) {
      throw new NotFoundException('Animateur non trouvé');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
