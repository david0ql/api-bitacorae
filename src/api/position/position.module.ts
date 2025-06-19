import { Module } from '@nestjs/common'

import { PositionService } from './position.service'
import { PositionController } from './position.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [PositionController],
	providers: [PositionService],
	imports: [DynamicDatabaseModule]
})

export class PositionModule {}
