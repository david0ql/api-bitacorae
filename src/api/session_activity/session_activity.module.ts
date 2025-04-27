import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SessionActivityService } from './session_activity.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { DateService } from 'src/services/date/date.service'
import { SessionActivityController } from './session_activity.controller'
import { SessionActivity } from 'src/entities/SessionActivity'
import { SessionActivityResponse } from 'src/entities/SessionActivityResponse'
import { Session } from 'src/entities/Session'
import { Platform } from 'src/entities/Platform'

@Module({
	controllers: [SessionActivityController],
	providers: [SessionActivityService, FileUploadService, MailService, DateService],
	imports: [TypeOrmModule.forFeature([SessionActivity, SessionActivityResponse, Session, Platform])]
})

export class SessionActivityModule {}
