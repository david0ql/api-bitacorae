import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

import { StrengthingAreaService } from './strengthing_area.service';
import { StrengthingAreaController } from './strengthing_area.controller';
import { StrengthingAreaEntity } from 'src/entities/strengthing_area.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StrengthingAreaEntity])],
  controllers: [StrengthingAreaController],
  providers: [StrengthingAreaService],
})

export class StrengthingAreaModule { }
