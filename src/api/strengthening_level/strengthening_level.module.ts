import { Module } from '@nestjs/common'

import { StrengtheningLevelService } from './strengthening_level.service'
import { StrengtheningLevelController } from './strengthening_level.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [StrengtheningLevelController],
	providers: [StrengtheningLevelService],
	imports: [DynamicDatabaseModule]
})

export class StrengtheningLevelModule {}
