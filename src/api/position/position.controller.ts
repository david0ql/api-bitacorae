import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { PositionService } from './position.service'
import { Position } from 'src/entities/Position'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('position')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PositionController {
	constructor(private readonly positionService: PositionService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Position>> {
		return this.positionService.findAll(pageOptionsDto, businessName)
	}
}
