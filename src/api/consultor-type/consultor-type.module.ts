import { Module } from '@nestjs/common';
import { ConsultorTypeService } from './consultor-type.service';
import { ConsultorTypeController } from './consultor-type.controller';

@Module({
  controllers: [ConsultorTypeController],
  providers: [ConsultorTypeService],
})
export class ConsultorTypeModule {}
