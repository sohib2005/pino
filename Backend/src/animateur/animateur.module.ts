import { Module } from '@nestjs/common';
import { AnimateurController } from './animateur.controller';
import { AnimateurService } from './animateur.service';

@Module({
  controllers: [AnimateurController],
  providers: [AnimateurService],
  exports: [AnimateurService],
})
export class AnimateurModule {}
