import { Module } from '@nestjs/common'

import { BusinessSizeService } from './business-size.service'
import { BusinessSizeController } from './business-size.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [BusinessSizeController],
	providers: [BusinessSizeService],
	imports: [DynamicDatabaseModule]
})

export class BusinessSizeModule {}
