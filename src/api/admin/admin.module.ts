import { Module } from '@nestjs/common'

import { AdminService } from './admin.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { AdminController } from './admin.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [AdminController],
	providers: [AdminService, FileUploadService, MailService],
	imports: [DynamicDatabaseModule]
})

export class AdminModule {}
