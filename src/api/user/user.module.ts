import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { UserService } from './user.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { UserController } from './user.controller'
import { User } from 'src/entities/User'
import { ContactInformation } from 'src/entities/ContactInformation'
import { Expert } from 'src/entities/Expert'
import { Admin } from 'src/entities/Admin'
import { Auditor } from 'src/entities/Auditor'
import { Business } from 'src/entities/Business'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

@Module({
	controllers: [UserController],
	providers: [UserService, FileUploadService],
	imports: [TypeOrmModule.forFeature([User, ContactInformation, Expert, Business, Admin, Auditor, StrengtheningArea])]
})

export class UserModule {}
