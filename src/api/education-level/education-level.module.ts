import { Module } from '@nestjs/common'

import { EducationLevelService } from './education-level.service'
import { EducationLevelController } from './education-level.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [EducationLevelController],
	providers: [EducationLevelService],
	imports: [DynamicDatabaseModule]
})

export class EducationLevelModule {}
