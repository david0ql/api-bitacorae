import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ExpertService } from './expert.service'
import { ExpertController } from './expert.controller'
import { ExpertEntity } from 'src/entities/expert.entity'
import { UserEntity } from 'src/entities/user.entity'
import { ConsultorTypeEntity } from 'src/entities/consultor_type.entity'

@Module({
	controllers: [ExpertController],
	providers: [ExpertService],
	imports: [TypeOrmModule.forFeature([ExpertEntity, UserEntity, ConsultorTypeEntity])]
})

export class ExpertModule {}
