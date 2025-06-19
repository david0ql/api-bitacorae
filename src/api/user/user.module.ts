import { Module } from '@nestjs/common'

import { UserService } from './user.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { UserController } from './user.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [UserController],
	providers: [UserService, FileUploadService, MailService],
	imports: [DynamicDatabaseModule]
})

export class UserModule {}
