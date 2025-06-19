import { Module } from '@nestjs/common'

import { ContactInformationService } from './contact-information.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { ContactInformationController } from './contact-information.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [ContactInformationController],
	providers: [ContactInformationService, FileUploadService],
	imports: [DynamicDatabaseModule]
})

export class ContactInformationModule {}
