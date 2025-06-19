import { Module } from '@nestjs/common'

import { DashboardService } from './dashboard.service'
import { DashboardController } from './dashboard.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [DashboardController],
	providers: [DashboardService],
	imports: [DynamicDatabaseModule]
})

export class DashboardModule {}
