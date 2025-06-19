import { Module } from '@nestjs/common'

import { CohortService } from './cohort.service'
import { CohortController } from './cohort.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'
import { DateService } from 'src/services/date/date.service'

@Module({
	controllers: [CohortController],
	providers: [CohortService, DateService],
	imports: [DynamicDatabaseModule]
})

export class CohortModule {}
