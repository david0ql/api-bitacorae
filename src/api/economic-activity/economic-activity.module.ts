import { Module } from '@nestjs/common'

import { EconomicActivityService } from './economic-activity.service'
import { EconomicActivityController } from './economic-activity.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [EconomicActivityController],
	providers: [EconomicActivityService],
	imports: [DynamicDatabaseModule]
})

export class EconomicActivityModule {}
