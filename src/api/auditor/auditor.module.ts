import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuditorService } from './auditor.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { AuditorController } from './auditor.controller'
import { User } from 'src/entities/User'
import { Auditor } from 'src/entities/Auditor'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { Platform } from 'src/entities/Platform'

@Module({
	controllers: [AuditorController],
	providers: [AuditorService, FileUploadService, MailService],
	imports: [TypeOrmModule.forFeature([User, Auditor, StrengtheningArea, Platform])]
})

export class AuditorModule {}
