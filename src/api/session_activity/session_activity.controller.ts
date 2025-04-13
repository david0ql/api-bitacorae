import { Controller, Get, Post, Body, Patch, Param, HttpCode, UseGuards, Query } from '@nestjs/common'

import { SessionActivityService } from './session_activity.service'
import { SessionActivity } from 'src/entities/SessionActivity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionActivityDto } from './dto/create-session_activity.dto'
import { RespondSessionActivityDto } from './dto/respond-session_activity.dto'
import { RateSessionActivityDto } from './dto/rate-session_activity.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Controller('session-activity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionActivityController {
	constructor(private readonly sessionActivityService: SessionActivityService) {}

	@Post()
	@HttpCode(200)
	create(@CurrentUser() user: JwtUser, @Body() createSessionActivityDto: CreateSessionActivityDto) {
		return this.sessionActivityService.create(user, createSessionActivityDto)
	}

	@Get('/bySession/:id')
	@HttpCode(200)
	findAll(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionActivity>> {
		return this.sessionActivityService.findAll(+id, pageOptionsDto)
	}

	@Patch(':id/respond')
	@HttpCode(200)
	respond(@CurrentUser() user: JwtUser, @Param('id') id: string, @Body() respondDto: RespondSessionActivityDto) {
		return this.sessionActivityService.respond(user, +id, respondDto)
	}

	@Patch(':id/rate')
	@HttpCode(200)
	rate(@Param('id') id: string, @Body() rateDto: RateSessionActivityDto) {
		return this.sessionActivityService.rate(+id, rateDto)
	}
}
