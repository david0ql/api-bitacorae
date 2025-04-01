import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { BusinessSizeService } from './business-size.service'
import { BusinessSizeEntity } from 'src/entities/business_size.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('business-size')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BusinessSizeController {
  	constructor(private readonly businessSizeService: BusinessSizeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<BusinessSizeEntity>> {
		return this.businessSizeService.findAll(pageOptionsDto)
	}
}
