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
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('accompaniment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AccompanimentController {
	constructor(private readonly accompanimentService: AccompanimentService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createAccompanimentDto: CreateAccompanimentDto, @BusinessName() businessName: string) {
		return this.accompanimentService.create(createAccompanimentDto, businessName)
	}

	@Get()
	@HttpCode(200)
	findAll(@CurrentUser() user: JwtUser, @Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Accompaniment>> {
		return this.accompanimentService.findAll(user, pageOptionsDto, businessName)
	}

	@Get('/byBusiness/:id')
	@HttpCode(200)
	findAllByBusiness(@CurrentUser() user: JwtUser, @Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Accompaniment>> {
		return this.accompanimentService.findAllByBusiness(user, +id, pageOptionsDto, businessName)
	}

	@Get('/byExpert/:id')
	@HttpCode(200)
	findAllByExpert(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Accompaniment>> {
		return this.accompanimentService.findAllByExpert(+id, pageOptionsDto, businessName)
	}

	@Get('/byBusinessForExpert/:bussinesId')
	@HttpCode(200)
	findOneByBusinessForExpert(@Param('bussinesId') bussinesId: string, @CurrentUser() user: JwtUser, @BusinessName() businessName: string) {
		return this.accompanimentService.findAllByBusinessForExpert(+bussinesId, user, businessName)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.accompanimentService.findOne(+id, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updateAccompanimentDto: UpdateAccompanimentDto, @BusinessName() businessName: string) {
		return this.accompanimentService.update(+id, updateAccompanimentDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.accompanimentService.remove(+id, businessName)
	}
}
