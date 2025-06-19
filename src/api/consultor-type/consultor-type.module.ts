import { Module } from '@nestjs/common'

import { ConsultorTypeService } from './consultor-type.service'
import { ConsultorTypeController } from './consultor-type.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [ConsultorTypeController],
	providers: [ConsultorTypeService],
	imports: [DynamicDatabaseModule]
})

export class ConsultorTypeModule {}
