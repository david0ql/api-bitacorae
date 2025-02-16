import { Module } from '@nestjs/common';
import { ProductoStatusService } from './producto-status.service';
import { ProductoStatusController } from './producto-status.controller';

@Module({
  controllers: [ProductoStatusController],
  providers: [ProductoStatusService],
})
export class ProductoStatusModule {}
