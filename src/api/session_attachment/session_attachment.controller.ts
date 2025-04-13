import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, Query } from '@nestjs/common'

import { SessionAttachmentService } from './session_attachment.service'
import { SessionAttachment } from 'src/entities/SessionAttachment'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionAttachmentDto } from './dto/create-session_attachment.dto'
import { UpdateSessionAttachmentDto } from './dto/update-session_attachment.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('session-attachment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionAttachmentController {
	constructor(private readonly sessionAttachmentService: SessionAttachmentService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createSessionAttachmentDto: CreateSessionAttachmentDto) {
		return this.sessionAttachmentService.create(createSessionAttachmentDto)
	}

	@Get('/bySession/:id')
	@HttpCode(200)
	findAll(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionAttachment>> {
		return this.sessionAttachmentService.findAll(+id, pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateSessionAttachmentDto: UpdateSessionAttachmentDto) {
		return this.sessionAttachmentService.update(+id, updateSessionAttachmentDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.sessionAttachmentService.remove(+id)
	}
}
