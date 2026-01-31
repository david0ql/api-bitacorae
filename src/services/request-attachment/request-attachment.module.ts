import { Module } from '@nestjs/common'
import { DynamicDatabaseModule } from '../dynamic-database/dynamic-database.module'
import { FileUploadService } from '../file-upload/file-upload.service'
import { AttachmentHomologationService } from './attachment-homologation.service'
import { RequestAttachmentService } from './request-attachment.service'

@Module({
	imports: [DynamicDatabaseModule],
	providers: [RequestAttachmentService, AttachmentHomologationService, FileUploadService],
	exports: [RequestAttachmentService]
})
export class RequestAttachmentModule {}
