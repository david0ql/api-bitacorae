import { Controller, Get, Post, Body, Param, Delete, HttpCode, Query, UseGuards } from '@nestjs/common'

import { ReportService } from './report.service'
import { Report } from 'src/entities/Report'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateReportDto } from './dto/create-report.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Controller('report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportController {
  	constructor(private readonly reportService: ReportService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createReportDto: CreateReportDto, @BusinessName() businessName: string) {
		return this.reportService.create(createReportDto, businessName)
	}

	@Get('instance')
	@HttpCode(200)
	getInstanceReport(@CurrentUser() user: JwtUser, @BusinessName() businessName: string) {
		return this.reportService.getInstanceReport(user, businessName)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Report>> {
		return this.reportService.findAll(pageOptionsDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.reportService.remove(+id, businessName)
	}
}
