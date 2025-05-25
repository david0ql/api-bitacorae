import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CohortService } from './cohort.service'
import { DateService } from 'src/services/date/date.service'
import { CohortController } from './cohort.controller'
import { Cohort } from 'src/entities/Cohort'

@Module({
	controllers: [CohortController],
	providers: [CohortService, DateService],
	imports: [TypeOrmModule.forFeature([Cohort])]
})

export class CohortModule {}
