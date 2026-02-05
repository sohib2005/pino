import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { PersonalizationService } from './personalization.service';
import { CreatePersonalizationDto } from './personalization.dto';

@Controller('personalizations')
export class PersonalizationController {
  constructor(private readonly personalizationService: PersonalizationService) {}

  @Post()
  create(@Body() body: CreatePersonalizationDto) {
    return this.personalizationService.create(body);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.personalizationService.getById(id);
  }
}
