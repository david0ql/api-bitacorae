import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { StrengthingLevelService } from './strengthing_level.service'
import { StrengthingLevelEntity } from 'src/entities/strengthing_level.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('strengthing-level')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StrengthingLevelController {
	constructor(private readonly strengthingLevelService: StrengthingLevelService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengthingLevelEntity>> {
		return this.strengthingLevelService.findAll(pageOptionsDto)
	}
}
