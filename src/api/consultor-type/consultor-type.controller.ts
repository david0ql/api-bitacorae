import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { ConsultorTypeService } from './consultor-type.service'
import { ConsultorType } from 'src/entities/ConsultorType'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateConsultorTypeDto } from './dto/create-consultor-type.dto'
import { UpdateConsultorTypeDto } from './dto/update-consultor-type.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('consultor-type')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class ConsultorTypeController {
	constructor(private readonly consultorTypeService: ConsultorTypeService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createConsultorTypeDto: CreateConsultorTypeDto, @BusinessName() businessName: string) {
		return this.consultorTypeService.create(createConsultorTypeDto, businessName)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<ConsultorType>> {
		return this.consultorTypeService.findAll(pageOptionsDto, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateConsultorTypeDto: UpdateConsultorTypeDto, @BusinessName() businessName: string) {
		return this.consultorTypeService.update(+id, updateConsultorTypeDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.consultorTypeService.remove(+id, businessName)
	}
}
