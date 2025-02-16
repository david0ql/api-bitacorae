import { Module } from '@nestjs/common';
import { MarketScopeService } from './market-scope.service';
import { MarketScopeController } from './market-scope.controller';

@Module({
  controllers: [MarketScopeController],
  providers: [MarketScopeService],
})
export class MarketScopeModule {}
