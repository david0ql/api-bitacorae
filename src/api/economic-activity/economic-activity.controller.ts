import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query } from '@nestjs/common'

import { EconomicActivityService } from './economic-activity.service'
import { EconomicActivityEntity } from 'src/entities/economic_activity.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateEconomicActivityDto } from './dto/create-economic-activity.dto'
import { UpdateEconomicActivityDto } from './dto/update-economic-activity.dto'

@Controller('economic-activity')
export class EconomicActivityController {
	constructor(private readonly economicActivityService: EconomicActivityService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createEconomicActivityDto: CreateEconomicActivityDto) {
		return this.economicActivityService.create(createEconomicActivityDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<EconomicActivityEntity>> {
		return this.economicActivityService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateEconomicActivityDto: UpdateEconomicActivityDto) {
		return this.economicActivityService.update(+id, updateEconomicActivityDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.economicActivityService.remove(+id)
	}
}
