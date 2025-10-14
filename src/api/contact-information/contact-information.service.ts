import { BadRequestException, Injectable } from '@nestjs/common'
import { In } from 'typeorm'

import { ContactInformation } from 'src/entities/ContactInformation'
import { Business } from 'src/entities/Business'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { CreateContactInformationDto } from './dto/create-contact-information.dto'
import { UpdateContactInformationDto } from './dto/update-contact-information.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import envVars from 'src/config/env'

@Injectable()
export class ContactInformationService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService
	) {}

	async create(createContactInformationDto: CreateContactInformationDto, businessName: string, file?: Express.Multer.File) {
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

		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para crear la información de contacto')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)
			const contactInformationRepository = businessDataSource.getRepository(ContactInformation)

			const business = await businessRepository.findOne({ where: { id: businessId } })
			if (!business) {
				if (fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException(`El negocio con id ${businessId} no fue encontrado`)
			}

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas)
			})

			const contactInformation = contactInformationRepository.create({
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

			return await contactInformationRepository.save(contactInformation)
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findOneByBusiness(id: number, businessName: string) {
		if (!id) return {}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const [contactInformation] = await businessDataSource.query(`
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
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateContactInformationDto: UpdateContactInformationDto, businessName: string, file?: Express.Multer.File) {
		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para actualizar la información de contacto')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		if(!id) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const contactInformationRepository = businessDataSource.getRepository(ContactInformation)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

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

			const existingContactInformation = await contactInformationRepository.findOne({
				where: { id },
				relations: ['strengtheningAreas']
			})

			if (!existingContactInformation) {
				if (fullPath) this.fileUploadService.deleteFile(fullPath)
				return { affected: 0 }
			}

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
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

			await contactInformationRepository.save(existingContactInformation)
			return { affected: 1 }
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const contactInformationRepository = businessDataSource.getRepository(ContactInformation)
			return await contactInformationRepository.delete(id)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
