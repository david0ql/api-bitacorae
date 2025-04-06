import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ContactInformationService } from './contact-information.service'
import { ContactInformationController } from './contact-information.controller'
import { ContactInformation } from 'src/entities/ContactInformation'

@Module({
	controllers: [ContactInformationController],
	providers: [ContactInformationService],
	imports: [TypeOrmModule.forFeature([ContactInformation])]
})

export class ContactInformationModule {}
