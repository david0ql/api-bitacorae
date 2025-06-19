import { Controller, Post, Body, HttpCode, Req } from '@nestjs/common'
import { Request } from 'express'

import { AuthService } from './auth.service'
import { AuthDto } from './dto/user.dto'
import { BusinessAuthDto } from './dto/business-auth.dto'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post()
	@HttpCode(200)
	login(@Body() authDto: AuthDto, @Req() req: Request) {
		const businessName = req['businessName']
		return this.authService.login(authDto, businessName)
	}

	@Post('business')
	@HttpCode(200)
	businessLogin(@Body() businessAuthDto: BusinessAuthDto) {
		return this.authService.businessLogin(businessAuthDto)
	}

	@Post('sync-database')
	@HttpCode(200)
	async syncDatabase(@Body() body: { db_name: string }) {
		return this.authService.syncDatabase(body.db_name)
	}
}
