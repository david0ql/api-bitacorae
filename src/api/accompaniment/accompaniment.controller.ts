import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards } from '@nestjs/common'

import { AccompanimentService } from './accompaniment.service'
import { Accompaniment } from 'src/entities/Accompaniment'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateAccompanimentDto } from './dto/create-accompaniment.dto'
import { UpdateAccompanimentDto } from './dto/update-accompaniment.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Controller('accompaniment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AccompanimentController {
	constructor(private readonly accompanimentService: AccompanimentService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createAccompanimentDto: CreateAccompanimentDto) {
		return this.accompanimentService.create(createAccompanimentDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@CurrentUser() user: JwtUser, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		return this.accompanimentService.findAll(user, pageOptionsDto)
	}

	@Get('/byBusiness/:id')
	@HttpCode(200)
	findAllByBusiness(@CurrentUser() user: JwtUser, @Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		return this.accompanimentService.findAllByBusiness(user, +id, pageOptionsDto)
	}

	@Get('/byExpert/:id')
	@HttpCode(200)
	findAllByExpert(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		return this.accompanimentService.findAllByExpert(+id, pageOptionsDto)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string) {
		return this.accompanimentService.findOne(+id)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateAccompanimentDto: UpdateAccompanimentDto) {
		return this.accompanimentService.update(+id, updateAccompanimentDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.accompanimentService.remove(+id)
	}
}
