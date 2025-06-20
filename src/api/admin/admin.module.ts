import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AdminService } from './admin.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { AdminController } from './admin.controller'
import { User } from 'src/entities/User'
import { Admin } from 'src/entities/Admin'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { Platform } from 'src/entities/Platform'

@Module({
	controllers: [AdminController],
	providers: [AdminService, FileUploadService, MailService],
	imports: [TypeOrmModule.forFeature([User, Admin, StrengtheningArea, Platform])]
})

export class AdminModule {}
