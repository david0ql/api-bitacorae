import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'

import { StrengthingAreaService } from './strengthing_area.service'
import { StrengthingAreaEntity } from 'src/entities/strengthing_area.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateStrengthingAreaDto } from './dto/create-strengthing-area.dto'
import { UpdateStrengthingAreaDto } from './dto/update-strengthing-area.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('strengthing-area')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StrengthingAreaController {
	constructor(private readonly strengthingAreaService: StrengthingAreaService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createStrengthingAreaDto: CreateStrengthingAreaDto) {
		return this.strengthingAreaService.create(createStrengthingAreaDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengthingAreaEntity>> {
		return this.strengthingAreaService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateStrengthingAreaDto: UpdateStrengthingAreaDto) {
		return this.strengthingAreaService.update(+id, updateStrengthingAreaDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.strengthingAreaService.remove(+id)
	}
}
