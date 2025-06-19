import { Module } from '@nestjs/common'

import { ExpertService } from './expert.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { ExpertController } from './expert.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [ExpertController],
	providers: [ExpertService, FileUploadService, MailService],
	imports: [DynamicDatabaseModule]
})

export class ExpertModule {}
