import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { StrengtheningLevelService } from './strengthening_level.service'
import { StrengtheningLevelEntity } from 'src/entities/strengthening_level.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('strengthening-level')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StrengtheningLevelController {
	constructor(private readonly strengtheningLevelService: StrengtheningLevelService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengtheningLevelEntity>> {
		return this.strengtheningLevelService.findAll(pageOptionsDto)
	}
}
