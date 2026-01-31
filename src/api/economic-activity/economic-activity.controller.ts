import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { EconomicActivityService } from './economic-activity.service'
import { EconomicActivity } from 'src/entities/EconomicActivity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateEconomicActivityDto } from './dto/create-economic-activity.dto'
import { UpdateEconomicActivityDto } from './dto/update-economic-activity.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('economic-activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class EconomicActivityController {
	constructor(private readonly economicActivityService: EconomicActivityService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createEconomicActivityDto: CreateEconomicActivityDto, @BusinessName() businessName: string) {
		return this.economicActivityService.create(createEconomicActivityDto, businessName)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<EconomicActivity>> {
		return this.economicActivityService.findAll(pageOptionsDto, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateEconomicActivityDto: UpdateEconomicActivityDto, @BusinessName() businessName: string) {
		return this.economicActivityService.update(+id, updateEconomicActivityDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.economicActivityService.remove(+id, businessName)
	}
}
