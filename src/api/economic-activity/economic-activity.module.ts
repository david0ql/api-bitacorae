import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { EconomicActivityService } from './economic-activity.service'
import { EconomicActivityController } from './economic-activity.controller'
import { EconomicActivityEntity } from 'src/entities/economic_activity.entity'

@Module({
	controllers: [EconomicActivityController],
	providers: [EconomicActivityService],
	imports: [TypeOrmModule.forFeature([EconomicActivityEntity])]
})

export class EconomicActivityModule {}
