import { Module } from '@nestjs/common';
import { EconomicActivityService } from './economic-activity.service';
import { EconomicActivityController } from './economic-activity.controller';

@Module({
  controllers: [EconomicActivityController],
  providers: [EconomicActivityService],
})
export class EconomicActivityModule {}
