import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards } from '@nestjs/common'

import { BusinessService } from './business.service'
import { BusinessEntity } from 'src/entities/business.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateBusinessDto } from './dto/create-business.dto'
import { UpdateBusinessDto } from './dto/update-business.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('business')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BusinessController {
	constructor(private readonly businessService: BusinessService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createBusinessDto: CreateBusinessDto) {
		return this.businessService.create(createBusinessDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<BusinessEntity>> {
		return this.businessService.findAll(pageOptionsDto)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string) {
		return this.businessService.findOne(+id)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto) {
		return this.businessService.update(+id, updateBusinessDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.businessService.remove(+id)
	}
}
