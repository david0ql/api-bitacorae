import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { StrengtheningAreaService } from './strengthening_area.service'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateStrengtheningAreaDto } from './dto/create-strengthening-area.dto'
import { UpdateStrengtheningAreaDto } from './dto/update-strengthening-area.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('strengthening-area')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class StrengtheningAreaController {
	constructor(private readonly strengtheningAreaService: StrengtheningAreaService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createStrengtheningAreaDto: CreateStrengtheningAreaDto, @BusinessName() businessName: string) {
		return this.strengtheningAreaService.create(createStrengtheningAreaDto, businessName)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<StrengtheningArea>> {
		return this.strengtheningAreaService.findAll(pageOptionsDto, businessName)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.strengtheningAreaService.findOne(+id, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateStrengtheningAreaDto: UpdateStrengtheningAreaDto, @BusinessName() businessName: string) {
		return this.strengtheningAreaService.update(+id, updateStrengtheningAreaDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.strengtheningAreaService.remove(+id, businessName)
	}
}
