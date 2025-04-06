import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ProductoStatusService } from './producto-status.service'
import { ProductoStatusController } from './producto-status.controller'
import { ProductStatus } from 'src/entities/ProductStatus'

@Module({
	controllers: [ProductoStatusController],
	providers: [ProductoStatusService],
	imports: [TypeOrmModule.forFeature([ProductStatus])]
})

export class ProductoStatusModule {}
