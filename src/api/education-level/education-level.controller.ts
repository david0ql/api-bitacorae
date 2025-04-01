import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { EducationLevelService } from './education-level.service'
import { EducationLevelEntity } from 'src/entities/education_level.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('education-level')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EducationLevelController {
	constructor(private readonly educationLevelService: EducationLevelService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<EducationLevelEntity>> {
		return this.educationLevelService.findAll(pageOptionsDto)
	}
}
