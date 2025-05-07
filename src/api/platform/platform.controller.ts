import { Body, Controller, Get, HttpCode, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'

import { PlatformService } from './platform.service'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'
import { CreatePlatformDto } from './dto/create-platform.dto'

@Controller('platform')
export class PlatformController {
	constructor(private readonly platformService: PlatformService) {}

	@Post()
	@HttpCode(200)
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@UseInterceptors(FileUploadInterceptor([
		{ name: 'logoFile', maxCount: 1 },
		{ name: 'reportHeaderImageFile', maxCount: 1 }
	], 'platform'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreatePlatformDto })
	create(@Body() createPlatformDto: CreatePlatformDto, @UploadedFiles() files: { logoFile?: Express.Multer.File[], reportHeaderImageFile?: Express.Multer.File[] }) {
		return this.platformService.create(createPlatformDto, files)
	}

	@Get()
	@HttpCode(200)
	findOne() {
		return this.platformService.findOne()
	}
}
