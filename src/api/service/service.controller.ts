import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common'

import { ServiceService } from './service.service'
import { ServiceEntity } from 'src/entities/service.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'

@Controller('service')
export class ServiceController {
	constructor(private readonly serviceService: ServiceService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createServiceDto: CreateServiceDto) {
		return this.serviceService.create(createServiceDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<ServiceEntity>> {
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
