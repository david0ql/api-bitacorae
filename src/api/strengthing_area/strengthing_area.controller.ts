import { Controller, Get, Query } from '@nestjs/common';

import { StrengthingAreaService } from './strengthing_area.service';

import { PageOptionsDto } from 'src/dto/page-options.dto';
import { PageDto } from 'src/dto/page.dto';

import { StrengthingAreaEntity } from 'src/entities/strengthing_area.entity';

@Controller('strengthing-area')
export class StrengthingAreaController {
  constructor(private readonly strengthingAreaService: StrengthingAreaService) {}

  @Get()
  findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengthingAreaEntity>> {
    return this.strengthingAreaService.findAll(pageOptionsDto);
  }
}
