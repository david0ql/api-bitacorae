import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { StrengtheningLevelService } from './strengthening_level.service'
import { StrengtheningLevelController } from './strengthening_level.controller'
import { StrengtheningLevelEntity } from 'src/entities/strengthening_level.entity'

@Module({
	controllers: [StrengtheningLevelController],
	providers: [StrengtheningLevelService],
	imports: [TypeOrmModule.forFeature([StrengtheningLevelEntity])]
})

export class StrengtheningLevelModule {}
