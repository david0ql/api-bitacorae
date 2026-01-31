import { Controller, Get, HttpCode, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { RoleService } from './role.service'
import { Role } from 'src/entities/Role'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('role')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Role>> {
		return this.roleService.findAll(pageOptionsDto, businessName)
	}
}
