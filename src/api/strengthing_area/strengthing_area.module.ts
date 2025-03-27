import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

import { StrengthingAreaService } from './strengthing_area.service'
import { StrengthingAreaController } from './strengthing_area.controller'
import { StrengthingAreaEntity } from 'src/entities/strengthing_area.entity'

@Module({
	controllers: [StrengthingAreaController],
	providers: [StrengthingAreaService],
	imports: [TypeOrmModule.forFeature([StrengthingAreaEntity])]
})

export class StrengthingAreaModule { }
