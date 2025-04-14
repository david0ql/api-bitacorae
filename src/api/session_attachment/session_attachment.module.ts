import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SessionAttachmentService } from './session_attachment.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { SessionAttachmentController } from './session_attachment.controller'
import { SessionAttachment } from 'src/entities/SessionAttachment'
import { Session } from 'src/entities/Session'

@Module({
	controllers: [SessionAttachmentController],
	providers: [SessionAttachmentService, FileUploadService],
	imports: [TypeOrmModule.forFeature([SessionAttachment, Session])]
})

export class SessionAttachmentModule {}
