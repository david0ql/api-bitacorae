import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { MarketScopeService } from './market-scope.service'
import { MarketScopeEntity } from 'src/entities/market_scope.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('market-scope')
export class MarketScopeController {
	constructor(private readonly marketScopeService: MarketScopeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<MarketScopeEntity>> {
		return this.marketScopeService.findAll(pageOptionsDto)
	}
}
