import { Module } from '@nestjs/common'

import { ReportService } from './report.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { PdfService } from 'src/services/pdf/pdf.service'
import { DateService } from 'src/services/date/date.service'
import { ReportController } from './report.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'
import { MailModule } from 'src/services/mail/mail.module'

@Module({
	controllers: [ReportController],
	providers: [ReportService, FileUploadService, PdfService, DateService],
	imports: [DynamicDatabaseModule, MailModule]
})

export class ReportModule {}
