import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { DocumentType } from 'src/entities/DocumentType'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Injectable()
export class DocumentTypeService {
	constructor(
		@InjectRepository(DocumentType)
		private readonly documentTypeRepository: Repository<DocumentType>
	) {}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<DocumentType>> {
		const queryBuilder = this.documentTypeRepository.createQueryBuilder('document_type')
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
	}
}
