import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ExpertService } from './expert.service'
import { ExpertController } from './expert.controller'
import { Expert } from 'src/entities/Expert'
import { User } from 'src/entities/User'
import { ConsultorType } from 'src/entities/ConsultorType'

@Module({
	controllers: [ExpertController],
	providers: [ExpertService],
	imports: [TypeOrmModule.forFeature([Expert, User, ConsultorType])]
})

export class ExpertModule {}
