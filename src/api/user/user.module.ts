import { Module } from '@nestjs/common'

import { UserService } from './user.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { UserController } from './user.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'
import { MailModule } from 'src/services/mail/mail.module'

@Module({
	controllers: [UserController],
	providers: [UserService, FileUploadService],
	imports: [DynamicDatabaseModule, MailModule]
})

export class UserModule {}
