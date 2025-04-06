import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EconomicActivityService } from './economic-activity.service'
import { EconomicActivityController } from './economic-activity.controller'
import { EconomicActivity } from 'src/entities/EconomicActivity'

@Module({
	controllers: [EconomicActivityController],
	providers: [EconomicActivityService],
	imports: [TypeOrmModule.forFeature([EconomicActivity])]
})

export class EconomicActivityModule {}
