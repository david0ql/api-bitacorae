import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PositionService } from './position.service'
import { PositionController } from './position.controller'
import { Position } from 'src/entities/Position'

@Module({
	controllers: [PositionController],
	providers: [PositionService],
	imports: [TypeOrmModule.forFeature([Position])]
})

export class PositionModule {}
