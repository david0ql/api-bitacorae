import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { DocumentTypeService } from './document-type.service'
import { DocumentTypeEntity } from 'src/entities/document_type.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('document-type')
export class DocumentTypeController {
	constructor(private readonly documentTypeService: DocumentTypeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<DocumentTypeEntity>> {
		return this.documentTypeService.findAll(pageOptionsDto)
	}
}
