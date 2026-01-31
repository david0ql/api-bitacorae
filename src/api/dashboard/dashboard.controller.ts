import { Controller, Get, HttpCode, UseGuards, UseInterceptors } from '@nestjs/common'
import { CacheTTL } from '@nestjs/cache-manager'

import { DashboardService } from './dashboard.service'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get()
	@HttpCode(200)
	@CacheTTL(60000)
	findAll(@BusinessName() businessName: string) {
		return this.dashboardService.findAll(businessName)
	}
}
