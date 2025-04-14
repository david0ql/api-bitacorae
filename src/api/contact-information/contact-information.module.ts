import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ContactInformationService } from './contact-information.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { ContactInformationController } from './contact-information.controller'
import { ContactInformation } from 'src/entities/ContactInformation'

@Module({
	controllers: [ContactInformationController],
	providers: [ContactInformationService, FileUploadService],
	imports: [TypeOrmModule.forFeature([ContactInformation])]
})

export class ContactInformationModule {}
