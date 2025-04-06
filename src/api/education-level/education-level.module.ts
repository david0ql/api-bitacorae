import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EducationLevelService } from './education-level.service'
import { EducationLevelController } from './education-level.controller'
import { EducationLevel } from 'src/entities/EducationLevel'

@Module({
	controllers: [EducationLevelController],
	providers: [EducationLevelService],
	imports: [TypeOrmModule.forFeature([EducationLevel])]
})

export class EducationLevelModule {}
