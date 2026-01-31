import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { ServiceService } from './service.service'
import { Service } from 'src/entities/Service'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateServiceDto } from './dto/create-service.dto'
import { UpdateServiceDto } from './dto/update-service.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('service')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class ServiceController {
	constructor(private readonly serviceService: ServiceService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createServiceDto: CreateServiceDto, @BusinessName() businessName: string) {
		return this.serviceService.create(createServiceDto, businessName)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Service>> {
		return this.serviceService.findAll(pageOptionsDto, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto, @BusinessName() businessName: string) {
		return this.serviceService.update(+id, updateServiceDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.serviceService.remove(+id, businessName)
	}
}
