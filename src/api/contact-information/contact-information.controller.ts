import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common'

import { ContactInformationService } from './contact-information.service'
import { CreateContactInformationDto } from './dto/create-contact-information.dto'
import { UpdateContactInformationDto } from './dto/update-contact-information.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('contact-information')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactInformationController {
	constructor(private readonly contactInformationService: ContactInformationService) {}

	@Post()
	create(@Body() createContactInformationDto: CreateContactInformationDto) {
		return this.contactInformationService.create(createContactInformationDto)
	}

	@Get(':id')
	findOne(@Param('id') id: string) {
		return this.contactInformationService.findOne(+id)
	}

	@Patch(':id')
	update(@Param('id') id: string, @Body() updateContactInformationDto: UpdateContactInformationDto) {
		return this.contactInformationService.update(+id, updateContactInformationDto)
	}
}
