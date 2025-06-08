import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ExpertService } from './expert.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { ExpertController } from './expert.controller'
import { Expert } from 'src/entities/Expert'
import { User } from 'src/entities/User'
import { ConsultorType } from 'src/entities/ConsultorType'
import { Platform } from 'src/entities/Platform'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

@Module({
	controllers: [ExpertController],
	providers: [ExpertService, FileUploadService, MailService],
	imports: [TypeOrmModule.forFeature([Expert, User, ConsultorType, Platform, StrengtheningArea])]
})

export class ExpertModule {}
