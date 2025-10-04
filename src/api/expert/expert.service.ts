import { In } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { Expert } from 'src/entities/Expert'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateExpertDto } from './dto/create-expert.dto'
import { UpdateExpertDto } from './dto/update-expert.dto'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'

import envVars from 'src/config/env'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Injectable()
export class ExpertService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	async create(createExpertDto: CreateExpertDto, businessName: string, file?: Express.Multer.File) {
		const {
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			consultorTypeId,
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
		} = createExpertDto

		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para crear el experto')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const expertRepository = businessDataSource.getRepository(Expert)
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
				roleId: 3,
				name: `${firstName} ${lastName}`,
				email,
				password: hash
			})

			const newUser = await userRepository.save(user)

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas)
			})

			const expert = expertRepository.create({
				userId: newUser.id,
				firstName,
				lastName,
				email,
				phone,
				documentTypeId,
				documentNumber,
				photo: fullPath,
				consultorTypeId,
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

			const savedExpert = await expertRepository.save(expert)

			try {
				this.mailService.sendWelcomeEmail({
					name: `${firstName} ${lastName}`,
					email,
					password
				}, businessName)
			} catch (e) {
				console.error('Error sending welcome email:', e)
			}

			return savedExpert
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<any>> {
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					e.id AS id,
					e.user_id AS userId,
					e.first_name AS firstName,
					e.last_name AS lastName,
					e.email AS email,
					e.phone AS phone,
					e.document_type_id AS documentTypeId,
					e.document_number AS documentNumber,
					CONCAT(?, '/', e.photo) AS photo,
					e.consultor_type_id AS consultorTypeId,
					ct.name AS consultorTypeName,
					e.gender_id AS genderId,
					e.experience_years AS experienceYears,
					e.education_level_id AS educationLevelId,
					e.facebook AS facebook,
					e.instagram AS instagram,
					e.twitter AS twitter,
					e.website AS website,
					e.linkedin AS linkedin,
					e.profile AS profile,
					u.active AS active,
					IF(u.active = 1, 'Si', 'No') AS userActive,
					IF(COUNT(sa.id) > 0,
						CONCAT('[',
							GROUP_CONCAT(DISTINCT JSON_OBJECT(
								'value', sa.id,
								'label', sa.name
							)),
						']'),
						NULL
					) AS strengtheningAreas
				FROM expert e
				INNER JOIN user u ON u.id = e.user_id
				INNER JOIN consultor_type ct ON ct.id = e.consultor_type_id
				LEFT JOIN expert_strengthening_area_rel esa ON esa.expert_id = e.id
				LEFT JOIN strengthening_area sa ON sa.id = esa.strengthening_area_id
				GROUP BY e.id
				ORDER BY e.id ${order}
				LIMIT ${skip}, ${take}
			`

			const countSql = `
				SELECT COUNT(DISTINCT e.id) AS total
				FROM expert e
			`

			const [rawItems, countResult] = await Promise.all([
				businessDataSource.query(sql, [envVars.APP_URL]),
				businessDataSource.query(countSql)
			])

			const items = rawItems.map(item => {
				const strengtheningAreas = item.strengtheningAreas ? JSON.parse(item.strengtheningAreas) : []
				return { ...item, strengtheningAreas }
			})

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllByFilter(filter: string, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			
			// If filter is empty or undefined, return all experts
			if (!filter || filter.trim() === '') {
				const result = await expertRepository
					.createQueryBuilder('e')
					.select(['e.id', 'e.firstName', 'e.lastName'])
					.getMany()
				return result
			}
			
			// Otherwise, filter by name
			const result = await expertRepository
				.createQueryBuilder('e')
				.select(['e.id', 'e.firstName', 'e.lastName'])
				.where('e.firstName LIKE :filter OR e.lastName LIKE :filter', { filter: `%${filter}%` })
				.getMany()
			return result
		} catch (error) {
			throw error
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllByAccompaniment(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					e.id AS id,
					e.first_name AS firstName,
					e.last_name AS lastName,
					e.email AS email,
					e.phone AS phone,
					CONCAT(?, '/', e.photo) AS photo,
					ct.name AS consultorTypeName,
					e.experience_years AS experienceYears,
					IF(COUNT(sa.id) > 0,
						CONCAT('[',
							GROUP_CONCAT(DISTINCT JSON_OBJECT(
								'value', sa.id,
								'label', sa.name
							)),
						']'),
						NULL
					) AS strengtheningAreas
				FROM expert e
				INNER JOIN consultor_type ct ON ct.id = e.consultor_type_id
				LEFT JOIN expert_strengthening_area_rel esa ON esa.expert_id = e.id
				LEFT JOIN strengthening_area sa ON sa.id = esa.strengthening_area_id
				WHERE e.id = ?
				GROUP BY e.id
			`

			const [expert] = await businessDataSource.query(sql, [envVars.APP_URL, id])

			if (!expert) return {}

			return {
				...expert,
				strengtheningAreas: expert.strengtheningAreas ? JSON.parse(expert.strengtheningAreas) : []
			}
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findOne(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			return await expertRepository.findOne({
				select: {
					id: true,
					userId: true,
					firstName: true,
					lastName: true,
					email: true,
					phone: true,
					documentTypeId: true,
					documentNumber: true,
					photo: true,
					consultorTypeId: true,
					genderId: true,
					experienceYears: true,
					educationLevelId: true,
					facebook: true,
					instagram: true,
					twitter: true,
					website: true,
					linkedin: true,
					profile: true,
					strengtheningAreas: {
						id: true,
						name: true
					}
				},
				where: { id },
				relations: ['strengtheningAreas']
			})
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async update(id: number, updateExpertDto: UpdateExpertDto, businessName: string, file?: Express.Multer.File) {
		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para actualizar el experto')
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const existingExpert = await expertRepository.findOne({
				where: { id },
				relations: ['strengtheningAreas']
			})

			if (!existingExpert) {
				throw new BadRequestException(`No se encontró un experto con el ID ${id}`)
			}

			const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		if (updateExpertDto.strengtheningAreas) {
			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(updateExpertDto.strengtheningAreas)
			})
			existingExpert.strengtheningAreas = strengtheningAreaEntities
		}

		if (fullPath) {
			existingExpert.photo = fullPath
		}

		// Remover strengtheningAreas del DTO antes de hacer Object.assign
		// porque ya las asignamos manualmente como entidades
		const { strengtheningAreas, ...updateData } = updateExpertDto
		Object.assign(existingExpert, updateData)

		await expertRepository.save(existingExpert)

		// Volver a consultar para obtener las relaciones
		return await expertRepository.findOne({
			where: { id },
			relations: ['strengtheningAreas'],
			select: {
				id: true,
				userId: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true,
				documentTypeId: true,
				documentNumber: true,
				photo: true,
				consultorTypeId: true,
				genderId: true,
				experienceYears: true,
				educationLevelId: true,
				facebook: true,
				instagram: true,
				twitter: true,
				website: true,
				linkedin: true,
				profile: true,
				strengtheningAreas: {
					id: true,
					name: true
				}
			}
		})
		} catch (e) {
			if (file) {
				const fullPath = this.fileUploadService.getFullPath('user', file.filename)
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async remove(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			return await expertRepository.delete(id)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllForBusiness(user: JwtUser, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			return await expertRepository.find({
				relations: ['user']
			})
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
