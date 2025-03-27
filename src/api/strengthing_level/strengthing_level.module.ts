import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { StrengthingLevelService } from './strengthing_level.service'
import { StrengthingLevelController } from './strengthing_level.controller'
import { StrengthingLevelEntity } from 'src/entities/strengthing_level.entity'

@Module({
	controllers: [StrengthingLevelController],
	providers: [StrengthingLevelService],
	imports: [TypeOrmModule.forFeature([StrengthingLevelEntity])]
})

export class StrengthingLevelModule {}
