import { Controller, Get, HttpCode, Query, UseGuards } from '@nestjs/common'

import { RoleService } from './role.service'
import { RoleEntity } from 'src/entities/role.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('role')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<RoleEntity>> {
		return this.roleService.findAll(pageOptionsDto)
	}
}
