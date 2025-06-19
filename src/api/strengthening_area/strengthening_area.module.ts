import { Module } from '@nestjs/common'

import { StrengtheningAreaService } from './strengthening_area.service'
import { StrengtheningAreaController } from './strengthening_area.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [StrengtheningAreaController],
	providers: [StrengtheningAreaService],
	imports: [DynamicDatabaseModule]
})

export class StrengtheningAreaModule {}
