import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PersonalizationController } from './personalization.controller';
import { PersonalizationService } from './personalization.service';

@Module({
  controllers: [PersonalizationController],
  providers: [PersonalizationService, PrismaService],
  exports: [PersonalizationService],
})
export class PersonalizationModule {}
