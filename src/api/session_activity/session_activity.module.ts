import { Module } from '@nestjs/common'

import { SessionActivityService } from './session_activity.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { DateService } from 'src/services/date/date.service'
import { SessionActivityController } from './session_activity.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [SessionActivityController],
	providers: [SessionActivityService, FileUploadService, MailService, DateService],
	imports: [DynamicDatabaseModule]
})

export class SessionActivityModule {}
