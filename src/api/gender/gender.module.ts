import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { GenderService } from './gender.service'
import { GenderController } from './gender.controller'
import { Gender } from 'src/entities/Gender'

@Module({
	controllers: [GenderController],
	providers: [GenderService],
	imports: [TypeOrmModule.forFeature([Gender])]
})

export class GenderModule {}
