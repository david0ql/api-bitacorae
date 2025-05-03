import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductStatusService } from './product-status.service'
import { ProductStatusController } from './product-status.controller'
import { ProductStatus } from 'src/entities/ProductStatus'

@Module({
	controllers: [ProductStatusController],
	providers: [ProductStatusService],
	imports: [TypeOrmModule.forFeature([ProductStatus])]
})

export class ProductStatusModule {}
