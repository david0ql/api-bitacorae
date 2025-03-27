import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { GenderService } from './gender.service'
import { GenderController } from './gender.controller'
import { GenderEntity } from 'src/entities/gender.entity'

@Module({
	controllers: [GenderController],
	providers: [GenderService],
	imports: [TypeOrmModule.forFeature([GenderEntity])]
})

export class GenderModule {}
