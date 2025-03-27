import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query } from '@nestjs/common'

import { ConsultorTypeService } from './consultor-type.service'
import { ConsultorTypeEntity } from 'src/entities/consultor_type.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateConsultorTypeDto } from './dto/create-consultor-type.dto'
import { UpdateConsultorTypeDto } from './dto/update-consultor-type.dto'

@Controller('consultor-type')
export class ConsultorTypeController {
	constructor(private readonly consultorTypeService: ConsultorTypeService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createConsultorTypeDto: CreateConsultorTypeDto) {
		return this.consultorTypeService.create(createConsultorTypeDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<ConsultorTypeEntity>> {
		return this.consultorTypeService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateConsultorTypeDto: UpdateConsultorTypeDto) {
		return this.consultorTypeService.update(+id, updateConsultorTypeDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.consultorTypeService.remove(+id)
	}
}
