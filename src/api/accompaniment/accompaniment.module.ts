import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AccompanimentService } from './accompaniment.service'
import { AccompanimentController } from './accompaniment.controller'
import { AccompanimentEntity } from 'src/entities/accompaniment.entity'
import { BusinessEntity } from 'src/entities/business.entity'
import { ExpertEntity } from 'src/entities/expert.entity'
import { StrengtheningAreaEntity } from 'src/entities/strengthening_area.entity'

@Module({
	controllers: [AccompanimentController],
	providers: [AccompanimentService],
	imports: [TypeOrmModule.forFeature([AccompanimentEntity, BusinessEntity, ExpertEntity, StrengtheningAreaEntity])]
})

export class AccompanimentModule {}
