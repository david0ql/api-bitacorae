import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common'

import { SessionService } from './session.service'
import { Session } from 'src/entities/Session'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessiontDto } from './dto/create-session.dto'
import { UpdateSessionDto } from './dto/update-session.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'

@Controller('session')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionController {
	constructor(private readonly sessionService: SessionService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('files', 'session-preparation', true))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateSessiontDto })
	create(@Body() createSessiontDto: CreateSessiontDto, @UploadedFiles() files?: Express.Multer.File[]) {
		return this.sessionService.create(createSessiontDto, files)
	}

	@Get('/byAccompaniment/:id')
	@HttpCode(200)
	findAllByAccompaniment(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Session>> {
		return this.sessionService.findAllByAccompaniment(+id, pageOptionsDto)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string) {
		return this.sessionService.findOne(+id)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('files', 'session-preparation', true))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateSessionDto })
	update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto, @UploadedFiles() files?: Express.Multer.File[]) {
		return this.sessionService.update(+id, updateSessionDto, files)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.sessionService.remove(+id)
	}
}
