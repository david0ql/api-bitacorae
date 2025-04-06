import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { DocumentTypeService } from './document-type.service'
import { DocumentType } from 'src/entities/DocumentType'

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
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<DocumentType>> {
		return this.documentTypeService.findAll(pageOptionsDto)
	}
}
