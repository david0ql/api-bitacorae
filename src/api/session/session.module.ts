import { Module } from '@nestjs/common'

import { SessionService } from './session.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { PdfService } from 'src/services/pdf/pdf.service'
import { DateService } from 'src/services/date/date.service'
import { SessionController } from './session.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [SessionController],
	providers: [SessionService, FileUploadService, MailService, PdfService, DateService],
	imports: [DynamicDatabaseModule]
})

export class SessionModule {}
