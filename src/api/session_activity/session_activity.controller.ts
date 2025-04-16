import { Controller, Get, Post, Body, Patch, Param, HttpCode, UseGuards, Query, UseInterceptors, UploadedFile } from '@nestjs/common'

import { SessionActivityService } from './session_activity.service'
import { SessionActivity } from 'src/entities/SessionActivity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionActivityDto } from './dto/create-session_activity.dto'
import { RespondSessionActivityDto } from './dto/respond-session_activity.dto'
import { RateSessionActivityDto } from './dto/rate-session_activity.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'

@Controller('session-activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionActivityController {
	constructor(private readonly sessionActivityService: SessionActivityService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'session-activity'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateSessionActivityDto })
	create(@CurrentUser() user: JwtUser, @Body() createSessionActivityDto: CreateSessionActivityDto, @UploadedFile() file?: Express.Multer.File) {
		return this.sessionActivityService.create(user, createSessionActivityDto, file)
	}

	@Get('/bySession/:id')
	@HttpCode(200)
	findAll(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionActivity>> {
		return this.sessionActivityService.findAll(+id, pageOptionsDto)
	}

	@Patch(':id/respond')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'session-activity'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: RespondSessionActivityDto })
	respond(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() respondDto: RespondSessionActivityDto, @UploadedFile() file?: Express.Multer.File) {
		return this.sessionActivityService.respond(user, +id, respondDto, file)
	}

	@Patch(':id/rate')
	@HttpCode(200)
	rate(@Param('id') id: string, @Body() rateDto: RateSessionActivityDto) {
		return this.sessionActivityService.rate(+id, rateDto)
	}
}
