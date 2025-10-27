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
import { BusinessName } from 'src/decorators/business-name.decorator'

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
	create(@Body() createSessionDto: CreateSessionDto, @BusinessName() businessName: string, @UploadedFiles() files?: Express.Multer.File[]) {
		console.log('🎯 [SESSION CONTROLLER] POST /session recibido')
		console.log('🎯 [SESSION CONTROLLER] Body recibido:', JSON.stringify(createSessionDto, null, 2))
		console.log('🎯 [SESSION CONTROLLER] Business name (dbName):', businessName)
		console.log('🎯 [SESSION CONTROLLER] Files:', files?.length || 0, 'archivos')
		
		return this.sessionService.create(createSessionDto, businessName, files)
	}

	@Get('/byAccompaniment/:id')
	@HttpCode(200)
	findAllByAccompaniment(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Session>> {
		return this.sessionService.findAllByAccompaniment(+id, pageOptionsDto, businessName)
	}

	@Get('/byBusinessForExpert/:bussinesId')
	@HttpCode(200)
	findAllByBusinessForExpert(@Param('bussinesId') bussinesId: string, @CurrentUser() user: JwtUser, @Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Session>> {
		return this.sessionService.findAllByBusinessForExpert(+bussinesId, user, pageOptionsDto, businessName)
	}

	@Get('/forBusiness')
	@HttpCode(200)
	findAllByBusiness(@CurrentUser() user: JwtUser, @Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Session>> {
		return this.sessionService.findAllForBusiness(user, pageOptionsDto, businessName)
	}

	@Get('/byFilter')
	@HttpCode(200)
	findAllByFilterEmpty(@BusinessName() businessName: string) {
		return this.sessionService.findAllByFilter('', businessName)
	}

	@Get('/byFilter/:filter')
	@HttpCode(200)
	findAllByFilter(@Param('filter') filter: string, @BusinessName() businessName: string) {
		return this.sessionService.findAllByFilter(filter, businessName)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@CurrentUser() user: JwtUser, @Param('id') id: string, @BusinessName() businessName: string) {
		return this.sessionService.findOne(user, +id, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('files', 'session-preparation', true))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateSessionDto })
	update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto, @BusinessName() businessName: string, @UploadedFiles() files?: Express.Multer.File[]) {
		console.log('🔍 [SESSION CONTROLLER] PATCH request received:', { id, updateSessionDto, businessName, filesCount: files?.length || 0 })
		return this.sessionService.update(+id, updateSessionDto, businessName, files)
	}

	@Patch('/public/:id')
	@HttpCode(200)
	public(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.sessionService.public(+id, businessName)
	}

	@Patch('/approved/:id')
	@HttpCode(200)
	approved(@Param('id') id: string, @Body() approvedSessiontDto: ApprovedSessionDto, @BusinessName() businessName: string) {
		return this.sessionService.approved(+id, approvedSessiontDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		console.log('🎯 [SESSION CONTROLLER] DELETE /session/:id recibido')
		console.log('🎯 [SESSION CONTROLLER] ID:', id)
		console.log('🎯 [SESSION CONTROLLER] Business name:', businessName)
		
		return this.sessionService.remove(+id, businessName)
	}
}
