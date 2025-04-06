import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards } from '@nestjs/common'

import { ExpertService } from './expert.service'
import { Expert } from 'src/entities/Expert'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateExpertDto } from './dto/create-expert.dto'
import { UpdateExpertDto } from './dto/update-expert.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('expert')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpertController {
	constructor(private readonly expertService: ExpertService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createExpertDto: CreateExpertDto) {
		return this.expertService.create(createExpertDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Expert>> {
		return this.expertService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateExpertDto: UpdateExpertDto) {
		return this.expertService.update(+id, updateExpertDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.expertService.remove(+id)
	}
}
