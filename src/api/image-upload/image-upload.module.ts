import { Module } from '@nestjs/common'

import { ImageUploadService } from './image-upload.service'
import { RoleController } from './image-upload.controller'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'

@Module({
	controllers: [RoleController],
	providers: [ImageUploadService, FileUploadService],
	imports: []
})

export class ImageUploadModule {}
