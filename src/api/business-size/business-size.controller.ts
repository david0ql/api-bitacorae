import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { BusinessSizeService } from './business-size.service'
import { BusinessSize } from 'src/entities/BusinessSize'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('business-size')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BusinessSizeController {
  	constructor(private readonly businessSizeService: BusinessSizeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<BusinessSize>> {
		return this.businessSizeService.findAll(pageOptionsDto, businessName)
	}
}
