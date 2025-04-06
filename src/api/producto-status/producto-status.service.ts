import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { ProductStatus } from 'src/entities/ProductStatus'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class ProductoStatusService {
	constructor(
		@InjectRepository(ProductStatus)
		private readonly productStatusRepository: Repository<ProductStatus>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<ProductStatus>> {
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
