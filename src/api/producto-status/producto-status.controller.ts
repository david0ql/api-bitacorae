import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { ProductoStatusService } from './producto-status.service'
import { ProductStatusEntity } from 'src/entities/product_status.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('producto-status')
export class ProductoStatusController {
  constructor(private readonly productoStatusService: ProductoStatusService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<ProductStatusEntity>> {
		return this.productoStatusService.findAll(pageOptionsDto)
	}
}
