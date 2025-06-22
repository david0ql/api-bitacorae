import { Module } from '@nestjs/common'

import { AuditorService } from './auditor.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { AuditorController } from './auditor.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [AuditorController],
	providers: [AuditorService, FileUploadService, MailService],
	imports: [DynamicDatabaseModule]
})

export class AuditorModule {}
