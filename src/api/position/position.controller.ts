import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { PositionService } from './position.service'
import { PositionEntity } from 'src/entities/position.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('position')
export class PositionController {
	constructor(private readonly positionService: PositionService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<PositionEntity>> {
		return this.positionService.findAll(pageOptionsDto)
	}
}
