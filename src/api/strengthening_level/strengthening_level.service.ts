import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'

import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class StrengtheningLevelService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<StrengtheningLevel>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}

		try {
			const strengtheningLevelRepository = businessDataSource.getRepository(StrengtheningLevel)
			
			const queryBuilder = strengtheningLevelRepository.createQueryBuilder('strengthening_level')
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
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
