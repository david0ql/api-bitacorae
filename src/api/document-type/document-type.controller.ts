import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { DocumentTypeService } from './document-type.service'
import { DocumentTypeEntity } from 'src/entities/document_type.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('document-type')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentTypeController {
	constructor(private readonly documentTypeService: DocumentTypeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<DocumentTypeEntity>> {
		return this.documentTypeService.findAll(pageOptionsDto)
	}
}
