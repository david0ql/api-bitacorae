import { Module } from '@nestjs/common'

import { PlatformService } from './platform.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { PlatformController } from './platform.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [PlatformController],
	providers: [PlatformService, FileUploadService],
	imports: [DynamicDatabaseModule]
})

export class PlatformModule {}
