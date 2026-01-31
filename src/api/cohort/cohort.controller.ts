import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { CohortService } from './cohort.service'
import { Cohort } from 'src/entities/Cohort'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateCohortDto } from './dto/create-cohort.dto'
import { UpdateCohortDto } from './dto/update-cohort.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('cohort')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class CohortController {
  	constructor(private readonly cohortService: CohortService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createCohortDto: CreateCohortDto, @BusinessName() businessName: string) {
		return this.cohortService.create(createCohortDto, businessName)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Cohort>> {
		return this.cohortService.findAll(pageOptionsDto, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateCohortDto: UpdateCohortDto, @BusinessName() businessName: string) {
		return this.cohortService.update(+id, updateCohortDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.cohortService.remove(+id, businessName)
	}
}
