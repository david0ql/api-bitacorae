import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ConsultorTypeService } from './consultor-type.service'
import { ConsultorTypeController } from './consultor-type.controller'
import { ConsultorType } from 'src/entities/ConsultorType'

@Module({
	controllers: [ConsultorTypeController],
	providers: [ConsultorTypeService],
	imports: [TypeOrmModule.forFeature([ConsultorType])]
})

export class ConsultorTypeModule {}
