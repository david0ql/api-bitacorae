import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ContactInformationService } from './contact-information.service'
import { ContactInformationController } from './contact-information.controller'
import { ContactInformationEntity } from 'src/entities/contact_information.entity'

@Module({
	controllers: [ContactInformationController],
	providers: [ContactInformationService],
	imports: [TypeOrmModule.forFeature([ContactInformationEntity])]
})

export class ContactInformationModule {}
