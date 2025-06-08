import { BadRequestException, Injectable } from '@nestjs/common'
import { In, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'

import { ContactInformation } from 'src/entities/ContactInformation'
import { Business } from 'src/entities/Business'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
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

		@InjectRepository(StrengtheningArea)
		private readonly strengtheningAreaRepository: Repository<StrengtheningArea>,

		private readonly fileUploadService: FileUploadService
	) {}

	async create(createContactInformationDto: CreateContactInformationDto, file?: Express.Multer.File) {
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
			strengtheningAreas,
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
			const strengtheningAreaEntities = await this.strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas)
			})

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
				strengtheningAreas: strengtheningAreaEntities,
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
		if (!id) return {}

		const [contactInformation] = await this.contactInformationRepository.query(`
			SELECT
				ci.id AS id,
				ci.business_id AS businessId,
				ci.first_name AS firstName,
				ci.last_name AS lastName,
				ci.email AS email,
				ci.phone AS phone,
				ci.document_type_id AS documentTypeId,
				ci.document_number AS documentNumber,
				CONCAT(?, '/', ci.photo) AS photo,
				ci.gender_id AS genderId,
				ci.experience_years AS experienceYears,
				ci.education_level_id AS educationLevelId,
				el.name AS educationLevelName,
				ci.facebook AS facebook,
				ci.instagram AS instagram,
				ci.twitter AS twitter,
				ci.website AS website,
				ci.linkedin AS linkedin,
				ci.profile AS profile,
				IF(COUNT(sa.id) > 0,
					CONCAT('[', GROUP_CONCAT(DISTINCT JSON_OBJECT(
						'value', sa.id,
						'label', sa.name
					)), ']'),
					NULL
				) AS strengtheningAreas
			FROM
				contact_information ci
				LEFT JOIN education_level el ON el.id = ci.education_level_id
				LEFT JOIN contact_information_strengthening_area_rel csar ON csar.contact_information_id = ci.id
				LEFT JOIN strengthening_area sa ON sa.id = csar.strengthening_area_id
			WHERE ci.business_id = ?
			GROUP BY ci.id
		`, [envVars.APP_URL, id])

		if (!contactInformation) return {}

		return {
			...contactInformation,
			strengtheningAreas: contactInformation.strengtheningAreas ? JSON.parse(contactInformation.strengtheningAreas) : []
		}
	}

	async update(id: number, updateContactInformationDto: UpdateContactInformationDto, file?: Express.Multer.File) {
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
			strengtheningAreas,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		} = updateContactInformationDto

		const existingContactInformation = await this.contactInformationRepository.findOne({
			where: { id },
			relations: ['strengtheningAreas']
		})

		if (!existingContactInformation) {
			if (fullPath) this.fileUploadService.deleteFile(fullPath)
			return { affected: 0 }
		}

		const strengtheningAreaEntities = await this.strengtheningAreaRepository.findBy({
			id: In(strengtheningAreas || []),
		})

		existingContactInformation.businessId = businessId ?? existingContactInformation.businessId
		existingContactInformation.firstName = firstName ?? existingContactInformation.firstName
		existingContactInformation.lastName = lastName ?? existingContactInformation.lastName
		existingContactInformation.email = email ?? existingContactInformation.email
		existingContactInformation.phone = phone ?? existingContactInformation.phone
		existingContactInformation.documentTypeId = documentTypeId ?? existingContactInformation.documentTypeId
		existingContactInformation.documentNumber = documentNumber ?? existingContactInformation.documentNumber
		existingContactInformation.photo = fullPath ?? existingContactInformation.photo
		existingContactInformation.genderId = genderId ?? existingContactInformation.genderId
		existingContactInformation.experienceYears = experienceYears ?? existingContactInformation.experienceYears
		existingContactInformation.educationLevelId = educationLevelId ?? existingContactInformation.educationLevelId
		existingContactInformation.facebook = facebook ?? existingContactInformation.facebook
		existingContactInformation.instagram = instagram ?? existingContactInformation.instagram
		existingContactInformation.twitter = twitter ?? existingContactInformation.twitter
		existingContactInformation.website = website ?? existingContactInformation.website
		existingContactInformation.linkedin = linkedin ?? existingContactInformation.linkedin
		existingContactInformation.profile = profile ?? existingContactInformation.profile
		existingContactInformation.strengtheningAreas = strengtheningAreaEntities

		await this.contactInformationRepository.save(existingContactInformation)

		return { affected: 1 }
	}
}
