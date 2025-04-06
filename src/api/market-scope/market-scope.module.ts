import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MarketScopeService } from './market-scope.service'
import { MarketScopeController } from './market-scope.controller'
import { MarketScope } from 'src/entities/MarketScope'

@Module({
	controllers: [MarketScopeController],
	providers: [MarketScopeService],
	imports: [TypeOrmModule.forFeature([MarketScope])]
})

export class MarketScopeModule {}
