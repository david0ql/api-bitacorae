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
	UploadedFiles,
	UseInterceptors,
	BadRequestException,
} from '@nestjs/common'
import { SessionAttachmentService } from './session_attachment.service'
import { RequestAttachment } from 'src/entities/RequestAttachment'
import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionAttachmentDto } from './dto/create-session_attachment.dto'

import { ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('session-attachment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionAttachmentController {
	constructor(private readonly sessionAttachmentService: SessionAttachmentService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'session-attachment', true))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateSessionAttachmentDto })
	create(@Body() createDto: CreateSessionAttachmentDto, @BusinessName() businessName: string, @UploadedFiles() files?: Express.Multer.File[]) {
		if (!files?.length && !createDto.externalPath) {
			throw new BadRequestException('File is required')
		}
		return this.sessionAttachmentService.create(createDto, files, businessName)
	}

	@Get('/bySession/:id')
	@HttpCode(200)
	findAll(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<RequestAttachment>> {
		return this.sessionAttachmentService.findAll(+id, pageOptionsDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.sessionAttachmentService.remove(+id, businessName)
	}
}
