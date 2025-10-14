import { Injectable } from '@nestjs/common'
import { EducationLevel } from 'src/entities/EducationLevel'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'

@Injectable()
export class EducationLevelService {
  	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<EducationLevel>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const educationLevelRepository = businessDataSource.getRepository(EducationLevel)
			
			const queryBuilder = educationLevelRepository.createQueryBuilder('education_level')
				.select([
					'education_level.id',
					'education_level.name'
				])
				.orderBy('education_level.name', pageOptionsDto.order)
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
