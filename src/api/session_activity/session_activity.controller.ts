import { Controller, Get, Post, Body, Patch, Param, HttpCode, UseGuards, Query, UseInterceptors, UploadedFiles } from '@nestjs/common'

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
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('session-activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionActivityController {
	constructor(private readonly sessionActivityService: SessionActivityService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'session-activity', true))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateSessionActivityDto })
	create(@CurrentUser() user: JwtUser, @Body() createSessionActivityDto: CreateSessionActivityDto, @BusinessName() businessName: string, @UploadedFiles() files?: Express.Multer.File[]) {
		console.log('🎯 [SESSION ACTIVITY CONTROLLER] POST /session-activity recibido')
		console.log('🎯 [SESSION ACTIVITY CONTROLLER] Body recibido:', JSON.stringify(createSessionActivityDto, null, 2))
		console.log('🎯 [SESSION ACTIVITY CONTROLLER] Business name (dbName):', businessName)
		console.log('🎯 [SESSION ACTIVITY CONTROLLER] Files:', files?.length || 0, 'archivos')
		
		return this.sessionActivityService.create(user, createSessionActivityDto, businessName, files)
	}

	@Get('/bySession/:id')
	@HttpCode(200)
	findAll(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<SessionActivity>> {
		console.log('🎯 [SESSION ACTIVITY CONTROLLER] GET /session-activity/bySession/:id recibido')
		console.log('🎯 [SESSION ACTIVITY CONTROLLER] Session ID:', id)
		console.log('🎯 [SESSION ACTIVITY CONTROLLER] Page options:', JSON.stringify(pageOptionsDto, null, 2))
		console.log('🎯 [SESSION ACTIVITY CONTROLLER] Business name (dbName):', businessName)
		
		return this.sessionActivityService.findAll(+id, pageOptionsDto, businessName)
	}

	@Patch(':id/respond')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'session-activity'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: RespondSessionActivityDto })
	respond(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() respondDto: RespondSessionActivityDto, @BusinessName() businessName: string, @UploadedFiles() file?: Express.Multer.File) {
		return this.sessionActivityService.respond(user, +id, respondDto, businessName, file)
	}

	@Patch(':id/rate')
	@HttpCode(200)
	rate(@Param('id') id: string, @Body() rateDto: RateSessionActivityDto, @BusinessName() businessName: string) {
		return this.sessionActivityService.rate(+id, rateDto, businessName)
	}
}
