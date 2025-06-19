import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { DocumentTypeService } from './document-type.service'
import { DocumentType } from 'src/entities/DocumentType'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('document-type')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentTypeController {
	constructor(private readonly documentTypeService: DocumentTypeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<DocumentType>> {
		return this.documentTypeService.findAll(pageOptionsDto, businessName)
	}
}
