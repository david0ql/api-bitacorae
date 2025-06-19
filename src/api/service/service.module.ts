import { Module } from '@nestjs/common'

import { ServiceService } from './service.service'
import { ServiceController } from './service.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [ServiceController],
	providers: [ServiceService],
	imports: [DynamicDatabaseModule]
})

export class ServiceModule {}
