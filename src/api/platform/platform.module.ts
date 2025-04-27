import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PlatformService } from './platform.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { PlatformController } from './platform.controller'
import { Platform } from 'src/entities/Platform'

@Module({
	controllers: [PlatformController],
	providers: [PlatformService, FileUploadService],
	imports: [TypeOrmModule.forFeature([Platform])]
})

export class PlatformModule {}
