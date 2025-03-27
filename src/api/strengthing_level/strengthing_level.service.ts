import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { StrengthingLevelEntity } from 'src/entities/strengthing_level.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class StrengthingLevelService {
	constructor(
		@InjectRepository(StrengthingLevelEntity)
		private readonly strengthingLevelRepository: Repository<StrengthingLevelEntity>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengthingLevelEntity>> {
		const queryBuilder = this.strengthingLevelRepository.createQueryBuilder('strengthing_level')
		.select([
			'strengthing_level.id',
			'strengthing_level.name'
		])
		.orderBy('strengthing_level.created_at')
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
