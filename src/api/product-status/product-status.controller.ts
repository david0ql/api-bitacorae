import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { ProductStatusService as ProductStatusService } from './product-status.service'
import { ProductStatus } from 'src/entities/ProductStatus'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('product-status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductStatusController {
  constructor(private readonly productStatusService: ProductStatusService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<ProductStatus>> {
		return this.productStatusService.findAll(pageOptionsDto)
	}
}
