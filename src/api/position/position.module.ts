import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PositionService } from './position.service'
import { PositionController } from './position.controller'
import { PositionEntity } from 'src/entities/position.entity'

@Module({
	controllers: [PositionController],
	providers: [PositionService],
	imports: [TypeOrmModule.forFeature([PositionEntity])]
})

export class PositionModule {}
