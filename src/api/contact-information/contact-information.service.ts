import { BadRequestException, Injectable } from '@nestjs/common'
import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

import { ContactInformation } from 'src/entities/ContactInformation'
import { Business } from 'src/entities/Business'
import { CreateContactInformationDto } from './dto/create-contact-information.dto'
import { UpdateContactInformationDto } from './dto/update-contact-information.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'

import envVars from 'src/config/env'

@Injectable()
export class ContactInformationService {
	constructor(
		@InjectRepository(ContactInformation)
		private readonly contactInformationRepository: Repository<ContactInformation>,

		@InjectRepository(Business)
		private readonly businessRepository: Repository<Business>,

		private readonly fileUploadService: FileUploadService
	) {}

	create(createContactInformationDto: CreateContactInformationDto, file?: Express.Multer.File) {
		const {
			businessId,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
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

		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		const business = this.businessRepository.findOne({ where: { id: businessId } })
		if (!business) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException(`El negocio con id ${businessId} no fue encontrado`)
		}

		try {
			const contactInformation = this.contactInformationRepository.create({
				businessId,
				firstName,
				lastName,
				email,
				phone,
				documentTypeId,
				documentNumber,
				photo: fullPath,
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
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}

	async findOneByBusiness(id: number) {
		if(!id) return {}

		const contactInformation = await this.contactInformationRepository
			.createQueryBuilder('ci')
			.select([
				'ci.id AS id',
				'ci.businessId AS businessId',
				'ci.firstName AS firstName',
				'ci.lastName AS lastName',
				'ci.email AS email',
				'ci.phone AS phone',
				'ci.documentTypeId AS documentTypeId',
				'ci.documentNumber AS documentNumber',
				'CONCAT(:appUrl, "/", ci.photo) AS photo',
				'ci.genderId AS genderId',
				'ci.experienceYears AS experienceYears',
				'ci.strengtheningAreaId AS strengtheningAreaId',
				'ci.educationLevelId AS educationLevelId',
				'el.name AS educationLevelName',
				'ci.facebook AS facebook',
				'ci.instagram AS instagram',
				'ci.twitter AS twitter',
				'ci.website AS website',
				'ci.linkedin AS linkedin',
				'ci.profile AS profile'
			])
			.innerJoin('ci.educationLevel', 'el')
			.where('ci.businessId = :businessId', { businessId: id })
			.setParameters({appUrl: envVars.APP_URL})
			.getRawOne()

		return contactInformation || {}
	}

	update(id: number, updateContactInformationDto: UpdateContactInformationDto, file?: Express.Multer.File) {
		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		if(!id) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		const {
			businessId,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
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

		return this.contactInformationRepository.update(id, {
			businessId,
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			photo: fullPath,
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
	}
}
