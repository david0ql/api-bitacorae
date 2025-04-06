import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'

import { ServiceService } from './service.service'
import { Service } from 'src/entities/Service'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('service')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServiceController {
	constructor(private readonly serviceService: ServiceService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createServiceDto: CreateServiceDto) {
		return this.serviceService.create(createServiceDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Service>> {
		return this.serviceService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
		return this.serviceService.update(+id, updateServiceDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.serviceService.remove(+id)
	}
}
