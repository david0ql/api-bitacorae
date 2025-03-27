import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { StrengthingLevelService } from './strengthing_level.service'
import { StrengthingLevelEntity } from 'src/entities/strengthing_level.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('strengthing-level')
export class StrengthingLevelController {
	constructor(private readonly strengthingLevelService: StrengthingLevelService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<StrengthingLevelEntity>> {
		return this.strengthingLevelService.findAll(pageOptionsDto)
	}
}
