import { Module } from '@nestjs/common';
import { BusinessSizeService } from './business-size.service';
import { BusinessSizeController } from './business-size.controller';

@Module({
  controllers: [BusinessSizeController],
  providers: [BusinessSizeService],
})
export class BusinessSizeModule {}
