import { Controller, Get, HttpCode, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { StrengtheningLevelService } from './strengthening_level.service'
import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('strengthening-level')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class StrengtheningLevelController {
	constructor(private readonly strengtheningLevelService: StrengtheningLevelService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<StrengtheningLevel>> {
		return this.strengtheningLevelService.findAll(pageOptionsDto, businessName)
	}
}
