import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { MarketScope } from 'src/entities/MarketScope'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class MarketScopeService {
 	constructor(
		@InjectRepository(MarketScope)
		private readonly marketScopeRepository: Repository<MarketScope>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<MarketScope>> {
		const queryBuilder = this.marketScopeRepository.createQueryBuilder('market_scope')
		.select([
			'market_scope.id',
			'market_scope.name'
		])
		.orderBy('market_scope.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
