import { Injectable } from '@nestjs/common'
import { CreateContactInformationDto } from './dto/create-contact-information.dto'
import { UpdateContactInformationDto } from './dto/update-contact-information.dto'
import { ContactInformation } from 'src/entities/ContactInformation'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'

@Injectable()
export class ContactInformationService {
	constructor(
		@InjectRepository(ContactInformation)
		private readonly contactInformationRepository: Repository<ContactInformation>
	) {}

	create(createContactInformationDto: CreateContactInformationDto) {
		const {
			businessId,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo,
			genderId,
			experienceYears,
			strengtheningAreaId,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		} = createContactInformationDto

		const contactInformation = this.contactInformationRepository.create({
			businessId,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo,
			genderId,
			experienceYears,
			strengtheningAreaId,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		})

		return this.contactInformationRepository.save(contactInformation)
	}

	async findOne(id: number) {
		if(!id) return {}

		const contactInformation = await this.contactInformationRepository.findOne({ where: { id } })

		return contactInformation || {}
	}

	update(id: number, updateContactInformationDto: UpdateContactInformationDto) {
		if(!id) return { affected: 0 }

		const {
			businessId,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo,
			genderId,
			experienceYears,
			strengtheningAreaId,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		} = updateContactInformationDto

		const contactInformation = this.contactInformationRepository.create({
			businessId,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo,
			genderId,
			experienceYears,
			strengtheningAreaId,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		})

		return this.contactInformationRepository.update(id, contactInformation)
	}
}
