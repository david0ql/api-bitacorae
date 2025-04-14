import { Controller, Get, Post, Body, Patch, Param, UseGuards, UseInterceptors, UploadedFile, HttpCode } from '@nestjs/common'

import { ContactInformationService } from './contact-information.service'
import { CreateContactInformationDto } from './dto/create-contact-information.dto'
import { UpdateContactInformationDto } from './dto/update-contact-information.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'

@Controller('contact-information')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactInformationController {
	constructor(private readonly contactInformationService: ContactInformationService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'contact-information'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateContactInformationDto })
	create(@Body() createContactInformationDto: CreateContactInformationDto, @UploadedFile() file?: Express.Multer.File) {
		return this.contactInformationService.create(createContactInformationDto, file)
	}

	@Get('/byBusiness/:id')
	@HttpCode(200)
	findOneByBusiness(@Param('id') id: string) {
		return this.contactInformationService.findOneByBusiness(+id)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'contact-information'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateContactInformationDto })
	update(@Param('id') id: string, @Body() updateContactInformationDto: UpdateContactInformationDto, @UploadedFile() file?: Express.Multer.File) {
		return this.contactInformationService.update(+id, updateContactInformationDto, file)
	}
}
