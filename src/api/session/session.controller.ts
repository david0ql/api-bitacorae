import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards } from '@nestjs/common'

import { SessionService } from './session.service'
import { Session } from 'src/entities/Session'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessiontDto } from './dto/create-session.dto'
import { UpdateSessionDto } from './dto/update-session.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('session')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SessionController {
	constructor(private readonly sessionService: SessionService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createSessiontDto: CreateSessiontDto) {
		return this.sessionService.create(createSessiontDto)
	}

	@Get('/byAccompaniment/:id')
	@HttpCode(200)
	findAll(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Session>> {
		return this.sessionService.findAll(+id, pageOptionsDto)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string) {
		return this.sessionService.findOne(+id)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto) {
		return this.sessionService.update(+id, updateSessionDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.sessionService.remove(+id)
	}
}
