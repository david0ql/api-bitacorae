import { In, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { Auditor } from 'src/entities/Auditor'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { UpdateAuditorDto } from './dto/update-auditor.dto'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'

import envVars from 'src/config/env'
import { MailService } from 'src/services/mail/mail.service'
import { CreateAuditorDto } from './dto/create-auditor.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'

@Injectable()
export class AuditorService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	async create(createAuditorDto: CreateAuditorDto, businessName: string, file?: Express.Multer.File) {
		const {
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
			profile,
			password
		} = createAuditorDto

		const fullPath = file ? this.fileUploadService.getFullPath('auditor', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const auditorRepository = businessDataSource.getRepository(Auditor)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const existingUser = await userRepository.findOne({ where: { email } })
			if(existingUser) {
				if(fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException(`El correo electrónico ${email} ya existe`)
			}

			const salt = bcrypt.genSaltSync(10)
			const hash = bcrypt.hashSync(password, salt)

			const user = userRepository.create({
				roleId: 2, // Auditor role
				name: `${firstName} ${lastName}`,
				email,
				password: hash
			})

			const newUser = await userRepository.save(user)

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas || [])
			})

			const auditor = auditorRepository.create({
				userId: newUser.id,
				firstName,
				lastName,
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

			const savedAuditor = await auditorRepository.save(auditor)

			try {
				this.mailService.sendWelcomeEmail({
					name: `${firstName} ${lastName}`,
					email,
					password
				}, businessName)
			} catch (e) {
				console.error('Error sending welcome email:', e)
			}

			return savedAuditor
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Auditor>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const auditorRepository = businessDataSource.getRepository(Auditor)

			const queryBuilder = auditorRepository.createQueryBuilder('a')
				.select([
					'a.id AS id',
					`CONCAT(a.firstName, ' ', a.lastName) AS name`,
					'a.documentNumber AS documentNumber',
					'dt.name AS documentTypeName',
					'a.phone AS phone',
					'u.email AS email',
					'u.createdAt AS createdAt',
				])
				.innerJoin('a.user', 'u')
				.leftJoin('a.documentType', 'dt')
				.where('u.roleId = :roleId', { roleId: 2 }) // Solo usuarios con role Auditor
				.orderBy('a.firstName', 'ASC')
				.addOrderBy('a.lastName', 'ASC')

			const [items, totalCount] = await Promise.all([
				queryBuilder.getRawMany(),
				queryBuilder.getCount()
			])

			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findOne(id: number, businessName: string) {
		if (!id) return {}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const auditorRepository = businessDataSource.getRepository(Auditor)

			const [auditor] = await auditorRepository.query(`
				SELECT
					u.id AS userId,
					u.email AS email,
					a.first_name AS firstName,
					a.last_name AS lastName,
					a.document_type_id AS documentTypeId,
					a.document_number AS documentNumber,
					a.phone AS phone,
					CONCAT(?, '/', a.photo) AS photo,
					a.gender_id AS genderId,
					a.education_level_id AS educationLevelId,
					a.experience_years AS experienceYears,
					a.facebook AS facebook,
					a.instagram AS instagram,
					a.twitter AS twitter,
					a.website AS website,
					a.linkedin AS linkedin,
					a.profile AS profile,
					IF(COUNT(sa.id) > 0,
						CONCAT('[',
							GROUP_CONCAT(DISTINCT JSON_OBJECT(
								'value', sa.id,
								'label', sa.name
							)),
						']'),
						NULL
					) AS strengtheningAreas
				FROM
					user u
					INNER JOIN auditor a ON a.user_id = u.id
					LEFT JOIN auditor_strengthening_area_rel asa ON asa.auditor_id = a.id
					LEFT JOIN strengthening_area sa ON sa.id = asa.strengthening_area_id
				WHERE a.id = ?
				GROUP BY u.id
			`, [envVars.APP_URL, id])

			if (!auditor) return {}

			return {
				...auditor,
				strengtheningAreas: auditor.strengtheningAreas ? JSON.parse(auditor.strengtheningAreas) : []
			}
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateAuditorDto: UpdateAuditorDto, businessName: string, file?: Express.Multer.File) {
		const fullPath = file ? this.fileUploadService.getFullPath('auditor', file.filename) : undefined
		if(!id) {
			if(fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		const {
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
		} = updateAuditorDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const auditorRepository = businessDataSource.getRepository(Auditor)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const existingUser = await userRepository.findOne({
				where: { email },
				relations: ['auditor']
			})

			if(existingUser && existingUser.auditor?.id !== id) {
				if(fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException(`El correo electrónico ${email} ya existe`)
			}

			const existingAuditor = await auditorRepository.findOne({
				where: { id },
				relations: ['strengtheningAreas']
			})

			if (!existingAuditor) {
				if (fullPath) this.fileUploadService.deleteFile(fullPath)
				return { affected: 0 }
			}

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas || []),
			})

			existingAuditor.firstName = firstName ?? existingAuditor.firstName
			existingAuditor.lastName = lastName ?? existingAuditor.lastName
			existingAuditor.phone = phone ?? existingAuditor.phone
			existingAuditor.documentTypeId = documentTypeId ?? existingAuditor.documentTypeId
			existingAuditor.documentNumber = documentNumber ?? existingAuditor.documentNumber
			existingAuditor.photo = fullPath ?? existingAuditor.photo
			existingAuditor.genderId = genderId ?? existingAuditor.genderId
			existingAuditor.experienceYears = experienceYears ?? existingAuditor.experienceYears
			existingAuditor.educationLevelId = educationLevelId ?? existingAuditor.educationLevelId
			existingAuditor.facebook = facebook ?? existingAuditor.facebook
			existingAuditor.instagram = instagram ?? existingAuditor.instagram
			existingAuditor.twitter = twitter ?? existingAuditor.twitter
			existingAuditor.website = website ?? existingAuditor.website
			existingAuditor.linkedin = linkedin ?? existingAuditor.linkedin
			existingAuditor.profile = profile ?? existingAuditor.profile
			existingAuditor.strengtheningAreas = strengtheningAreaEntities

			await auditorRepository.save(existingAuditor)

			await userRepository.update(existingAuditor.userId, {
				name: `${firstName} ${lastName}`,
				email
			})

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
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const auditorRepository = businessDataSource.getRepository(Auditor)

			const existingAuditor = await auditorRepository.findOne({ where: { id } })
			if (!existingAuditor) return { affected: 0 }

			const auditorData = await auditorRepository.findOne({
				select: { userId: true },
				where: { id }
			})

			const result = await auditorRepository.delete(id)

			if(auditorData) {
				await userRepository.delete(auditorData.userId)
			}

			if (existingAuditor.photo) {
				this.fileUploadService.deleteFile(existingAuditor.photo)
			}

			return result
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
