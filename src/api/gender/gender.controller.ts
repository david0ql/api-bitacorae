import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { GenderService } from './gender.service'
import { GenderEntity } from 'src/entities/gender.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('gender')
export class GenderController {
	constructor(private readonly genderService: GenderService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<GenderEntity>> {
		return this.genderService.findAll(pageOptionsDto)
	}
}
