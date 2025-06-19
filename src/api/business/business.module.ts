import { Module } from '@nestjs/common'

import { BusinessService } from './business.service'
import { MailService } from 'src/services/mail/mail.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { BusinessController } from './business.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [BusinessController],
	providers: [BusinessService, FileUploadService, MailService],
	imports: [DynamicDatabaseModule]
})

export class BusinessModule {}
