import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query } from '@nestjs/common'

import { ExpertService } from './expert.service'
import { ExpertEntity } from 'src/entities/expert.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateExpertDto } from './dto/create-expert.dto'
import { UpdateExpertDto } from './dto/update-expert.dto'

@Controller('expert')
export class ExpertController {
	constructor(private readonly expertService: ExpertService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createExpertDto: CreateExpertDto) {
		return this.expertService.create(createExpertDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<ExpertEntity>> {
		return this.expertService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateExpertDto: UpdateExpertDto) {
		return this.expertService.update(+id, updateExpertDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.expertService.remove(+id)
	}
}
