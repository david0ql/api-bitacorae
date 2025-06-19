import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { MarketScopeService } from './market-scope.service'
import { MarketScope } from 'src/entities/MarketScope'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('market-scope')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MarketScopeController {
	constructor(private readonly marketScopeService: MarketScopeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<MarketScope>> {
		return this.marketScopeService.findAll(pageOptionsDto, businessName)
	}
}
