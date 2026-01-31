import { Controller, Get, HttpCode, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { ProductStatusService as ProductStatusService } from './product-status.service'
import { ProductStatus } from 'src/entities/ProductStatus'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('product-status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class ProductStatusController {
  constructor(private readonly productStatusService: ProductStatusService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<ProductStatus>> {
		return this.productStatusService.findAll(pageOptionsDto, businessName)
	}
}
