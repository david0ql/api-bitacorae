import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { PositionEntity } from 'src/entities/position.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class PositionService {
  	constructor(
		@InjectRepository(PositionEntity)
		private readonly positionRepository: Repository<PositionEntity>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<PositionEntity>> {
		const queryBuilder = this.positionRepository.createQueryBuilder('position')
		.select([
			'position.id',
			'position.name'
		])
		.orderBy('position.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
