import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'

import { StrengtheningAreaService } from './strengthening_area.service'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateStrengtheningAreaDto } from './dto/create-strengthening-area.dto'
import { UpdateStrengtheningAreaDto } from './dto/update-strengthening-area.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('strengthening-area')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StrengtheningAreaController {
	constructor(private readonly strengtheningAreaService: StrengtheningAreaService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createStrengtheningAreaDto: CreateStrengtheningAreaDto) {
		return this.strengtheningAreaService.create(createStrengtheningAreaDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengtheningArea>> {
		return this.strengtheningAreaService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateStrengtheningAreaDto: UpdateStrengtheningAreaDto) {
		return this.strengtheningAreaService.update(+id, updateStrengtheningAreaDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.strengtheningAreaService.remove(+id)
	}
}
