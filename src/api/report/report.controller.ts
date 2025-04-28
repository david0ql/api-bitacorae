import { Controller, Get, Post, Body, Param, Delete, HttpCode, Query, UseGuards } from '@nestjs/common'

import { ReportService } from './report.service'
import { Report } from 'src/entities/Report'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateReportDto } from './dto/create-report.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportController {
  	constructor(private readonly reportService: ReportService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createReportDto: CreateReportDto) {
		return this.reportService.create(createReportDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Report>> {
		return this.reportService.findAll(pageOptionsDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.reportService.remove(+id)
	}
}
