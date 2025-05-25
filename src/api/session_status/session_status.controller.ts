import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { SessionStatusService } from './session_status.service'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { SessionStatus } from 'src/entities/SessionStatus'

@Controller('session-status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionStatusController {
	constructor(private readonly sessionStatusService: SessionStatusService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionStatus>> {
		return this.sessionStatusService.findAll(pageOptionsDto)
	}
}
