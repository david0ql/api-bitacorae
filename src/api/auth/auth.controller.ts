import { Controller, Post, Body, HttpCode } from '@nestjs/common'

import { AuthService } from './auth.service'
import { AuthDto } from './dto/user.dto'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post()
	@HttpCode(200)
	login(@Body() authDto: AuthDto) {
		return this.authService.login(authDto)
	}
}
