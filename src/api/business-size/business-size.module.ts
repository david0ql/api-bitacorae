import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { BusinessSizeService } from './business-size.service'
import { BusinessSizeController } from './business-size.controller'
import { BusinessSize } from 'src/entities/BusinessSize'

@Module({
	controllers: [BusinessSizeController],
	providers: [BusinessSizeService],
	imports: [TypeOrmModule.forFeature([BusinessSize])]
})

export class BusinessSizeModule {}
