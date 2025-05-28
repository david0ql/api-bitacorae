import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common'

import { SessionService } from './session.service'
import { Session } from 'src/entities/Session'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdateSessionDto } from './dto/update-session.dto'
import { ApprovedSessionDto } from './dto/approved-session.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('session')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionController {
	constructor(private readonly sessionService: SessionService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('files', 'session-preparation', true))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateSessionDto })
	create(@Body() createSessionDto: CreateSessionDto, @UploadedFiles() files?: Express.Multer.File[]) {
		return this.sessionService.create(createSessionDto, files)
	}

	@Get('/byAccompaniment/:id')
	@HttpCode(200)
	findAllByAccompaniment(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Session>> {
		return this.sessionService.findAllByAccompaniment(+id, pageOptionsDto)
	}

	@Get('/byAccompanimentAndExpert/:accompanimentId/:expertId')
	@HttpCode(200)
	findAllByAccompanimentAndExpert(@Param('accompanimentId') accompanimentId: string, @Param('expertId') expertId: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Session>> {
		return this.sessionService.findAllByAccompanimentAndExpert(+accompanimentId, +expertId, pageOptionsDto)
	}

	@Get('/forBusiness')
	@HttpCode(200)
	findAllByBusiness(@CurrentUser() user: JwtUser, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Session>> {
		return this.sessionService.findAllForBusiness(user, pageOptionsDto)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@CurrentUser() user: JwtUser, @Param('id') id: string) {
		return this.sessionService.findOne(user, +id)
	}

	@Get('/byFilter/:filter')
	@HttpCode(200)
	findAllByFilter(@Param('filter') filter: string) {
		return this.sessionService.findAllByFilter(filter)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('files', 'session-preparation', true))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateSessionDto })
	update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto, @UploadedFiles() files?: Express.Multer.File[]) {
		return this.sessionService.update(+id, updateSessionDto, files)
	}

	@Patch('/public/:id')
	@HttpCode(200)
	public(@Param('id') id: string) {
		return this.sessionService.public(+id)
	}

	@Patch('/approved/:id')
	@HttpCode(200)
	approved(@Param('id') id: string, @Body() approvedSessiontDto: ApprovedSessionDto) {
		return this.sessionService.approved(+id, approvedSessiontDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.sessionService.remove(+id)
	}
}
