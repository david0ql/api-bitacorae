import { Injectable } from '@nestjs/common'
import { ProductStatus } from 'src/entities/ProductStatus'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class ProductStatusService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<ProductStatus>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) {
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}
		try {
			const productStatusRepository = businessDataSource.getRepository(ProductStatus)
			const queryBuilder = productStatusRepository.createQueryBuilder('product_status')
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
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
