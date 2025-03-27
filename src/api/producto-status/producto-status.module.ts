import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductoStatusService } from './producto-status.service'
import { ProductoStatusController } from './producto-status.controller'
import { ProductStatusEntity } from 'src/entities/product_status.entity'

@Module({
	controllers: [ProductoStatusController],
	providers: [ProductoStatusService],
	imports: [TypeOrmModule.forFeature([ProductStatusEntity])]
})

export class ProductoStatusModule {}
