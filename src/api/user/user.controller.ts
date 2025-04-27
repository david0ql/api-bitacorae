import { Controller, Get, Post, Body, Patch, Param, UseGuards, HttpCode, UseInterceptors, UploadedFile } from '@nestjs/common'

import { UserService } from './user.service'

import { UpdateUserDto } from './dto/update-user.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Controller('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	@HttpCode(200)
	findOne(@CurrentUser() user: JwtUser) {
		return this.userService.findOne(user)
	}

	@Patch('/change-password')
	@HttpCode(200)
	changePassword(@CurrentUser() user: JwtUser, @Body() changePasswordDto: ChangePasswordDto) {
		return this.userService.changePassword(user, changePasswordDto)
	}

	@Patch()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'user'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateUserDto })
	update(@CurrentUser() user: JwtUser, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file?: Express.Multer.File) {
		return this.userService.update(user, updateUserDto, file)
	}
}
