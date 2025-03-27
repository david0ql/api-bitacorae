import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { BusinessSizeService } from './business-size.service'
import { BusinessSizeController } from './business-size.controller'
import { BusinessSizeEntity } from 'src/entities/business_size.entity'

@Module({
	controllers: [BusinessSizeController],
	providers: [BusinessSizeService],
	imports: [TypeOrmModule.forFeature([BusinessSizeEntity])]
})

export class BusinessSizeModule {}
