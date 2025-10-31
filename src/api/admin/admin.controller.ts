import { Controller, Get, Post, Body, Patch, Param, UseGuards, HttpCode, UseInterceptors, UploadedFile, Delete, Query } from '@nestjs/common'

import { AdminService } from './admin.service'

import { CreateAdminDto } from './dto/create-admin.dto'
import { UpdateAdminDto } from './dto/update-admin.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { PageDto } from 'src/dto/page.dto'
import { Admin } from 'src/entities/Admin'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
	constructor(private readonly adminService: AdminService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'admin'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateAdminDto })
	create(@Body() createAdminDto: CreateAdminDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.adminService.create(createAdminDto, businessName, file)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Admin>> {
		return this.adminService.findAll(pageOptionsDto, businessName)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.adminService.findOne(+id, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'admin'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateAdminDto })
	update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.adminService.update(+id, updateAdminDto, businessName, file)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.adminService.remove(+id, businessName)
	}
}
