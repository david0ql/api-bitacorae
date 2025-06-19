import { Module } from '@nestjs/common'

import { ProductStatusService } from './product-status.service'
import { ProductStatusController } from './product-status.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [ProductStatusController],
	providers: [ProductStatusService],
	imports: [DynamicDatabaseModule]
})

export class ProductStatusModule {}
