import { Module } from '@nestjs/common'

import { ImageUploadService } from './image-upload.service'
import { RoleController } from './image-upload.controller'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [RoleController],
	providers: [ImageUploadService, FileUploadService],
	imports: [DynamicDatabaseModule]
})

export class ImageUploadModule {}
