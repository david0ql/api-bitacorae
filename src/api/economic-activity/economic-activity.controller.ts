import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EconomicActivityService } from './economic-activity.service';
import { CreateEconomicActivityDto } from './dto/create-economic-activity.dto';
import { UpdateEconomicActivityDto } from './dto/update-economic-activity.dto';

@Controller('economic-activity')
export class EconomicActivityController {
  constructor(private readonly economicActivityService: EconomicActivityService) {}

  @Post()
  create(@Body() createEconomicActivityDto: CreateEconomicActivityDto) {
    return this.economicActivityService.create(createEconomicActivityDto);
  }

  @Get()
  findAll() {
    return this.economicActivityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.economicActivityService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEconomicActivityDto: UpdateEconomicActivityDto) {
    return this.economicActivityService.update(+id, updateEconomicActivityDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.economicActivityService.remove(+id);
  }
}
