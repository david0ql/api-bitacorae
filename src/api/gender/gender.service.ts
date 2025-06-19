import { Injectable } from '@nestjs/common'

import { Gender } from 'src/entities/Gender'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class GenderService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Gender>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const genderRepository = businessDataSource.getRepository(Gender)
			
			const queryBuilder = genderRepository.createQueryBuilder('gender')
				.select([
					'gender.id',
					'gender.name'
				])
				.orderBy('gender.id', pageOptionsDto.order)
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
