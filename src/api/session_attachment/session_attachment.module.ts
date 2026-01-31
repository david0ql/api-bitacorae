import { Module } from '@nestjs/common'

import { SessionAttachmentService } from './session_attachment.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { SessionAttachmentController } from './session_attachment.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'
import { RequestAttachmentModule } from 'src/services/request-attachment/request-attachment.module'

@Module({
	controllers: [SessionAttachmentController],
	providers: [SessionAttachmentService, FileUploadService],
	imports: [DynamicDatabaseModule, RequestAttachmentModule]
})

export class SessionAttachmentModule {}
