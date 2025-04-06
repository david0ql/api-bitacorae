import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Position } from 'src/entities/Position'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class PositionService {
  	constructor(
		@InjectRepository(Position)
		private readonly positionRepository: Repository<Position>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Position>> {
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
