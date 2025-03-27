import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { BusinessSizeService } from './business-size.service'
import { BusinessSizeEntity } from 'src/entities/business_size.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('business-size')
export class BusinessSizeController {
  	constructor(private readonly businessSizeService: BusinessSizeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<BusinessSizeEntity>> {
		return this.businessSizeService.findAll(pageOptionsDto)
	}
}
