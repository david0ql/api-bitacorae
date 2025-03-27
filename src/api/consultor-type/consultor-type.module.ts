import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ConsultorTypeService } from './consultor-type.service'
import { ConsultorTypeController } from './consultor-type.controller'
import { ConsultorTypeEntity } from 'src/entities/consultor_type.entity'

@Module({
	controllers: [ConsultorTypeController],
	providers: [ConsultorTypeService],
	imports: [TypeOrmModule.forFeature([ConsultorTypeEntity])]
})

export class ConsultorTypeModule {}
