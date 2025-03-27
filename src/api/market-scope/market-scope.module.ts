import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MarketScopeService } from './market-scope.service'
import { MarketScopeController } from './market-scope.controller'
import { MarketScopeEntity } from 'src/entities/market_scope.entity'

@Module({
	controllers: [MarketScopeController],
	providers: [MarketScopeService],
	imports: [TypeOrmModule.forFeature([MarketScopeEntity])]
})

export class MarketScopeModule {}
