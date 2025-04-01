import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { GenderService } from './gender.service'
import { GenderEntity } from 'src/entities/gender.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('gender')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GenderController {
	constructor(private readonly genderService: GenderService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<GenderEntity>> {
		return this.genderService.findAll(pageOptionsDto)
	}
}
