import { Module } from '@nestjs/common'

import { AuditorService } from './auditor.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { AuditorController } from './auditor.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'
import { MailModule } from 'src/services/mail/mail.module'

@Module({
	controllers: [AuditorController],
	providers: [AuditorService, FileUploadService],
	imports: [DynamicDatabaseModule, MailModule]
})

export class AuditorModule {}
