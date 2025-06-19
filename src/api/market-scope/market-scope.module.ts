import { Module } from '@nestjs/common'

import { MarketScopeService } from './market-scope.service'
import { MarketScopeController } from './market-scope.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [MarketScopeController],
	providers: [MarketScopeService],
	imports: [DynamicDatabaseModule]
})

export class MarketScopeModule {}
