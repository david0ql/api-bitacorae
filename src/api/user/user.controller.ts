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
import { ChangePasswordByAdminDto } from './dto/change-password-by-admin.dto'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { UserCacheInterceptor } from 'src/services/cache/user-cache.interceptor'

@Controller('user')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(UserCacheInterceptor)
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	@HttpCode(200)
	findOne(@CurrentUser() user: JwtUser, @BusinessName() businessName: string) {
		return this.userService.findOne(user, businessName)
	}

	@Patch('/change-password')
	@HttpCode(200)
	changePassword(@CurrentUser() user: JwtUser, @Body() changePasswordDto: ChangePasswordDto, @BusinessName() businessName: string) {
		return this.userService.changePassword(user, changePasswordDto, businessName)
	}

	@Patch('/change-password-by-admin')
	@HttpCode(200)
	changePasswordByAdmin(@Body() changePasswordByAdminDto: ChangePasswordByAdminDto, @BusinessName() businessName: string) {
		return this.userService.changePasswordByAdmin(changePasswordByAdminDto, businessName)
	}

	@Patch()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'user'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateUserDto })
	update(@CurrentUser() user: JwtUser, @Body() updateUserDto: UpdateUserDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.userService.update(user, updateUserDto, businessName, file)
	}
}
