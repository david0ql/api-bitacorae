import { Module } from '@nestjs/common'

import { AccompanimentService } from './accompaniment.service'
import { AccompanimentController } from './accompaniment.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [AccompanimentController],
	providers: [AccompanimentService],
	imports: [DynamicDatabaseModule]
})

export class AccompanimentModule {}
