import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common'

import { MenuService } from './menu.service'

import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('menu')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MenuController {
	constructor(private readonly menuService: MenuService) {}

	@Get()
	@HttpCode(200)
	findAll(@CurrentUser() user: JwtUser, @BusinessName() businessName: string) {
		return this.menuService.findAll(user.roleId, businessName)
	}
}
