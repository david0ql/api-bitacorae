import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { StrengtheningLevelService } from './strengthening_level.service'
import { StrengtheningLevelController } from './strengthening_level.controller'
import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'

@Module({
	controllers: [StrengtheningLevelController],
	providers: [StrengtheningLevelService],
	imports: [TypeOrmModule.forFeature([StrengtheningLevel])]
})

export class StrengtheningLevelModule {}
