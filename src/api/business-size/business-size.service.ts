import { Injectable } from '@nestjs/common'

import { BusinessSize } from 'src/entities/BusinessSize'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class BusinessSizeService {
 	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<BusinessSize>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const businessSizeRepository = businessDataSource.getRepository(BusinessSize)
			
			const queryBuilder = businessSizeRepository.createQueryBuilder('business_size')
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
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
