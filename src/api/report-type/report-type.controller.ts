import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { ReportTypeService } from './report-type.service'
import { ReportType } from 'src/entities/ReportType'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('report-type')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportTypeController {
	constructor(private readonly reportTypeService: ReportTypeService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<ReportType>> {
		return this.reportTypeService.findAll(pageOptionsDto)
	}
}
