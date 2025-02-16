import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PageOptionsDto } from 'src/dto/page-options.dto';
import { PageMetaDto } from 'src/dto/page-meta.dto';
import { PageDto } from 'src/dto/page.dto';

import { StrengthingAreaEntity } from 'src/entities/strengthing_area.entity';

@Injectable()
export class StrengthingAreaService {

  constructor(
    @InjectRepository(StrengthingAreaEntity)
    private readonly strengthingAreaRepository: Repository<StrengthingAreaEntity>
  ) { }

  async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengthingAreaEntity>> {
    const queryBuilder = this.strengthingAreaRepository.createQueryBuilder('strengthing_area')
      .orderBy('strengthing_area.created_at')
      .skip(pageOptionsDto.skip)
      .take(pageOptionsDto.take)

      const [ items, totalCount ] = await queryBuilder.getManyAndCount()

      const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount });

      return new PageDto(items, pageMetaDto);
  }
}
