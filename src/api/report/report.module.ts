import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ReportService } from './report.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DateService } from 'src/services/date/date.service'
import { PdfService } from 'src/services/pdf/pdf.service'
import { ReportController } from './report.controller'
import { Report } from 'src/entities/Report'
import { Session } from 'src/entities/Session'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'
import { SessionAttachment } from 'src/entities/SessionAttachment'
import { Platform } from 'src/entities/Platform'
import { Business } from 'src/entities/Business'

@Module({
	controllers: [ReportController],
	providers: [ReportService, FileUploadService, DateService, PdfService],
	imports: [TypeOrmModule.forFeature([Report, Session, SessionPreparationFile, SessionAttachment, Platform, Business])]
})

export class ReportModule {}
