import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AccompanimentService } from './accompaniment.service'
import { AccompanimentController } from './accompaniment.controller'
import { Accompaniment } from 'src/entities/Accompaniment'
import { Business } from 'src/entities/Business'
import { Expert } from 'src/entities/Expert'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

@Module({
	controllers: [AccompanimentController],
	providers: [AccompanimentService],
	imports: [TypeOrmModule.forFeature([Accompaniment, Business, Expert, StrengtheningArea])]
})

export class AccompanimentModule {}
