import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Delete,
	UseGuards,
	HttpCode,
	Query,
	UploadedFile,
	UseInterceptors,
} from '@nestjs/common'
import { SessionAttachmentService } from './session_attachment.service'
import { SessionAttachment } from 'src/entities/SessionAttachment'
import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionAttachmentDto } from './dto/create-session_attachment.dto'

import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'

@Controller('session-attachment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionAttachmentController {
	constructor(private readonly sessionAttachmentService: SessionAttachmentService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'session-attachment'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateSessionAttachmentDto })
	create(@Body() createDto: CreateSessionAttachmentDto, @UploadedFile() file?: Express.Multer.File) {
		return this.sessionAttachmentService.create(createDto, file)
	}

	@Get('/bySession/:id')
	@HttpCode(200)
	findAll(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionAttachment>> {
		return this.sessionAttachmentService.findAll(+id, pageOptionsDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.sessionAttachmentService.remove(+id)
	}
}
