import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ConsultorTypeService } from './consultor-type.service';
import { CreateConsultorTypeDto } from './dto/create-consultor-type.dto';
import { UpdateConsultorTypeDto } from './dto/update-consultor-type.dto';

@Controller('consultor-type')
export class ConsultorTypeController {
  constructor(private readonly consultorTypeService: ConsultorTypeService) {}

  @Post()
  create(@Body() createConsultorTypeDto: CreateConsultorTypeDto) {
    return this.consultorTypeService.create(createConsultorTypeDto);
  }

  @Get()
  findAll() {
    return this.consultorTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultorTypeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateConsultorTypeDto: UpdateConsultorTypeDto) {
    return this.consultorTypeService.update(+id, updateConsultorTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.consultorTypeService.remove(+id);
  }
}
