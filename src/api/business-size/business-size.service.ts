import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { BusinessSizeEntity } from 'src/entities/business_size.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class BusinessSizeService {
 	constructor(
		@InjectRepository(BusinessSizeEntity)
		private readonly businessSizeRepository: Repository<BusinessSizeEntity>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<BusinessSizeEntity>> {
		const queryBuilder = this.businessSizeRepository.createQueryBuilder('business_size')
		.select([
			'business_size.id',
			'business_size.name'
		])
		.orderBy('business_size.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
