import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SessionService } from './session.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { PdfService } from 'src/services/pdf/pdf.service'
import { DateService } from 'src/services/date/date.service'
import { SessionController } from './session.controller'
import { Session } from 'src/entities/Session'
import { Accompaniment } from 'src/entities/Accompaniment'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'
import { SessionAttachment } from 'src/entities/SessionAttachment'
import { Platform } from 'src/entities/Platform'

@Module({
	controllers: [SessionController],
	providers: [SessionService, FileUploadService, MailService, PdfService, DateService],
	imports: [TypeOrmModule.forFeature([Session, SessionPreparationFile,  Accompaniment, SessionAttachment, Platform])]
})

export class SessionModule {}
