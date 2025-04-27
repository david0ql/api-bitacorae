import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { UserService } from './user.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { UserController } from './user.controller'
import { User } from 'src/entities/User'
import { ContactInformation } from 'src/entities/ContactInformation'
import { Expert } from 'src/entities/Expert'
import { Admin } from 'src/entities/Admin'

@Module({
	controllers: [UserController],
	providers: [UserService, FileUploadService],
	imports: [TypeOrmModule.forFeature([User, ContactInformation, Expert, Admin])]
})

export class UserModule {}
