import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { BusinessService } from './business.service'
import { MailService } from 'src/services/mail/mail.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { BusinessController } from './business.controller'
import { Business } from 'src/entities/Business'
import { User } from 'src/entities/User'
import { Platform } from 'src/entities/Platform'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { EconomicActivity } from 'src/entities/EconomicActivity'

@Module({
	controllers: [BusinessController],
	providers: [BusinessService, FileUploadService, MailService],
	imports: [TypeOrmModule.forFeature([Business, User, Platform, StrengtheningArea, EconomicActivity])]
})

export class BusinessModule {}
