import { Module } from '@nestjs/common'

import { ExpertService } from './expert.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { ExpertController } from './expert.controller'
import { ExpertPublicController } from './expert-public.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'
import { MailModule } from 'src/services/mail/mail.module'

@Module({
	controllers: [ExpertController, ExpertPublicController],
	providers: [ExpertService, FileUploadService],
	imports: [DynamicDatabaseModule, MailModule]
})

export class ExpertModule {}
