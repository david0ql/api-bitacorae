import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

import { StrengtheningAreaService } from './strengthening_area.service'
import { StrengtheningAreaController } from './strengthening_area.controller'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

@Module({
	controllers: [StrengtheningAreaController],
	providers: [StrengtheningAreaService],
	imports: [TypeOrmModule.forFeature([StrengtheningArea])]
})

export class StrengtheningAreaModule { }
