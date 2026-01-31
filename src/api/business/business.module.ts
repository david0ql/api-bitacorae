import { Module } from '@nestjs/common'

import { BusinessService } from './business.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { BusinessController } from './business.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'
import { MailModule } from 'src/services/mail/mail.module'
import { RequestAttachmentModule } from 'src/services/request-attachment/request-attachment.module'

@Module({
	controllers: [BusinessController],
	providers: [BusinessService, FileUploadService],
	imports: [DynamicDatabaseModule, MailModule, RequestAttachmentModule]
})

export class BusinessModule {}
