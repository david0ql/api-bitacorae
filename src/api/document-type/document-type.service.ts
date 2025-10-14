import { Injectable } from '@nestjs/common'
import { DocumentType } from 'src/entities/DocumentType'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class DocumentTypeService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<DocumentType>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) {
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}
		try {
			const documentTypeRepository = businessDataSource.getRepository(DocumentType)
			const queryBuilder = documentTypeRepository.createQueryBuilder('document_type')
				.select([
					'document_type.id',
					'document_type.name'
				])
				.orderBy('document_type.name', pageOptionsDto.order)
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
