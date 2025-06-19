import { Module } from '@nestjs/common'

import { ReportTypeService } from './report-type.service'
import { ReportTypeController } from './report-type.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [ReportTypeController],
	providers: [ReportTypeService],
	imports: [DynamicDatabaseModule]
})

export class ReportTypeModule {}
