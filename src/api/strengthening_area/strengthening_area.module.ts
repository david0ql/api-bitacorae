import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

import { StrengtheningAreaService } from './strengthening_area.service'
import { StrengtheningAreaController } from './strengthening_area.controller'
import { StrengtheningAreaEntity } from 'src/entities/strengthening_area.entity'

@Module({
	controllers: [StrengtheningAreaController],
	providers: [StrengtheningAreaService],
	imports: [TypeOrmModule.forFeature([StrengtheningAreaEntity])]
})

export class StrengtheningAreaModule { }
