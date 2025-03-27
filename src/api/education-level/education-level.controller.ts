import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { EducationLevelService } from './education-level.service'
import { EducationLevelEntity } from 'src/entities/education_level.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('education-level')
export class EducationLevelController {
	constructor(private readonly educationLevelService: EducationLevelService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<EducationLevelEntity>> {
		return this.educationLevelService.findAll(pageOptionsDto)
	}
}
