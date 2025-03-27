import { Controller, Get, HttpCode, Query } from '@nestjs/common'

import { RoleService } from './role.service'
import { RoleEntity } from 'src/entities/role.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'

@Controller('role')
export class RoleController {
	constructor(private readonly roleService: RoleService) {}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<RoleEntity>> {
		return this.roleService.findAll(pageOptionsDto)
	}
}
