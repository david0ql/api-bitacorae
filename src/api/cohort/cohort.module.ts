import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { CohortService } from './cohort.service'
import { CohortController } from './cohort.controller'
import { CohortEntity } from 'src/entities/cohort.entity'

@Module({
	controllers: [CohortController],
	providers: [CohortService],
	imports: [TypeOrmModule.forFeature([CohortEntity])]
})

export class CohortModule {}
