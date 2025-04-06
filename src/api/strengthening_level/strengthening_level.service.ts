import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class StrengtheningLevelService {
	constructor(
		@InjectRepository(StrengtheningLevel)
		private readonly strengtheningLevelRepository: Repository<StrengtheningLevel>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengtheningLevel>> {
		const queryBuilder = this.strengtheningLevelRepository.createQueryBuilder('strengthening_level')
		.select([
			'strengthening_level.id',
			'strengthening_level.name'
		])
		.orderBy('strengthening_level.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
