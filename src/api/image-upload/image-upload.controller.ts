import { Controller, HttpCode, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'

import { ImageUploadService } from './image-upload.service'

import { ApiBearerAuth, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'

@Controller('image-upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RoleController {
	constructor(private readonly imageUploadService: ImageUploadService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'richText'))
	@ApiConsumes('multipart/form-data')
	postImage(@UploadedFile() file?: Express.Multer.File) {
		return this.imageUploadService.postImage(file)
	}
}
