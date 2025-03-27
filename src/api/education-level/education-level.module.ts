import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EducationLevelService } from './education-level.service'
import { EducationLevelController } from './education-level.controller'
import { EducationLevelEntity } from 'src/entities/education_level.entity'

@Module({
	controllers: [EducationLevelController],
	providers: [EducationLevelService],
	imports: [TypeOrmModule.forFeature([EducationLevelEntity])]
})

export class EducationLevelModule {}
