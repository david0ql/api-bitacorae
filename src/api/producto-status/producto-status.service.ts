import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { ProductStatusEntity } from 'src/entities/product_status.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class ProductoStatusService {
	constructor(
		@InjectRepository(ProductStatusEntity)
		private readonly productStatusRepository: Repository<ProductStatusEntity>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<ProductStatusEntity>> {
		const queryBuilder = this.productStatusRepository.createQueryBuilder('product_status')
		.select([
			'product_status.id',
			'product_status.name'
		])
		.orderBy('product_status.id', pageOptionsDto.order)
		.skip(pageOptionsDto.skip)
		.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
