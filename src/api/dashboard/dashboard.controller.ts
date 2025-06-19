import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common'

import { DashboardService } from './dashboard.service'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get()
	@HttpCode(200)
	findAll(@BusinessName() businessName: string) {
		return this.dashboardService.findAll(businessName)
	}
}
