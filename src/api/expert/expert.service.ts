import { DataSource, In, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { Expert } from 'src/entities/Expert'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

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
		@InjectRepository(Expert)
		private readonly expertRepository: Repository<Expert>,

		@InjectRepository(User)
		private readonly userRepository: Repository<User>,

		@InjectRepository(StrengtheningArea)
		private readonly strengtheningAreaRepository: Repository<StrengtheningArea>,

		private readonly dataSource: DataSource,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	async create(createExpertDto: CreateExpertDto, file?: Express.Multer.File) {
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

		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		const existingUser = await this.userRepository.findOne({ where: { email } })
		if(existingUser) {
			if(fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException(`El correo electrónico ${email} ya existe`)
		}

		try {
			const salt = bcrypt.genSaltSync(10)
			const hash = bcrypt.hashSync(password, salt)

			const user = this.userRepository.create({
				roleId: 3,
				name: `${firstName} ${lastName}`,
				email,
				password: hash
			})

			const newUser = await this.userRepository.save(user)

			const strengtheningAreaEntities = await this.strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas)
			})

			const expert = this.expertRepository.create({
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

			const savedExpert = await this.expertRepository.save(expert)

			try {
				this.mailService.sendWelcomeEmail({
					name: `${firstName} ${lastName}`,
					email,
					password
				})
			} catch (e) {
				console.error('Error sending welcome email:', e)
			}

			return savedExpert
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<any>> {
		const { take, skip, order } = pageOptionsDto

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
			this.expertRepository.query(sql, [envVars.APP_URL]),
			this.expertRepository.query(countSql)
		])

		const items = rawItems.map(item => {
			const strengtheningAreas = item.strengtheningAreas ? JSON.parse(item.strengtheningAreas) : []

			return {
				...item,
				strengtheningAreas
			}
		})

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
		return new PageDto(items, pageMetaDto)
	}

	async findAllForBusiness(user: JwtUser) {
		const { id: userId } = user

		let businessId = await this.dataSource.query(`
			SELECT b.id
			FROM business b
			INNER JOIN user u ON b.user_id = u.id
			WHERE u.id = ?
		`, [userId])

		if (!businessId || !businessId.length) return []

		businessId = businessId[0].id

		const experts = await this.expertRepository
			.createQueryBuilder('e')
			.select([
				'e.id AS value',
				'CONCAT(e.firstName, " ", e.lastName, " - ", e.email) AS label'
			])
			.innerJoin('e.accompaniments', 'a')
			.where('a.businessId = :businessId', { businessId })
			.groupBy('e.id')
			.orderBy('e.firstName', 'ASC')
			.addOrderBy('e.lastName', 'ASC')
			.addOrderBy('e.email', 'ASC')
			.getRawMany()

		return experts || []
	}

	async findAllByFilter(filter: string) {
		if(!filter) return []

		const experts = await this.expertRepository
			.createQueryBuilder('e')
			.select([
				'e.id AS value',
				'CONCAT(e.firstName, " ", e.lastName, " - ", e.email) AS label'
			])
			.innerJoin('e.user', 'user')
			.where('e.firstName LIKE :filter OR e.lastName LIKE :filter OR e.email LIKE :filter', { filter: `%${filter}%` })
			.andWhere('user.active = 1')
			.take(10)
			.getRawMany()

		return experts || []
	}

	async findAllByAccompaniment(id: number) {
		if(!id) return {}

		const experts = await this.expertRepository
			.createQueryBuilder('e')
			.select([
				'e.id AS id',
				'CONCAT(e.firstName, " ", e.lastName, " - ", e.email) AS name'
			])
			.innerJoin('e.accompaniments', 'a')
			.where('a.id = :id', { id })
			.groupBy('e.id')
			.getRawOne()

		return experts || {}
	}

	async findOne(id: number) {
		if (!id) return {}

		const [expert] = await this.expertRepository.query(`
			SELECT
				e.id AS id,
				e.user_id AS userId,
				e.first_name AS firstName,
				e.last_name AS lastName,
				e.email AS email,
				e.phone AS phone,
				e.document_type_id AS documentTypeId,
				dt.name AS documentTypeName,
				e.document_number AS documentNumber,
				CONCAT(?, '/', e.photo) AS photo,
				e.consultor_type_id AS consultorTypeId,
				ct.name AS consultorTypeName,
				e.gender_id AS genderId,
				g.name AS genderName,
				e.experience_years AS experienceYears,
				e.education_level_id AS educationLevelId,
				ed.name AS educationLevelName,
				e.facebook AS facebook,
				e.instagram AS instagram,
				e.twitter AS twitter,
				e.website AS website,
				e.linkedin AS linkedin,
				e.profile AS profile,
				u.active AS active,
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
				expert e
				INNER JOIN user u ON u.id = e.user_id
				INNER JOIN consultor_type ct ON ct.id = e.consultor_type_id
				INNER JOIN document_type dt ON dt.id = e.document_type_id
				INNER JOIN gender g ON g.id = e.gender_id
				INNER JOIN education_level ed ON ed.id = e.education_level_id
				LEFT JOIN expert_strengthening_area_rel esar ON esar.expert_id = e.id
				LEFT JOIN strengthening_area sa ON sa.id = esar.strengthening_area_id
			WHERE e.id = ?
			GROUP BY e.id
		`, [envVars.APP_URL, id])

		if (!expert) return {}

		return {
			...expert,
			strengtheningAreas: expert.strengtheningAreas ? JSON.parse(expert.strengtheningAreas) : []
		}
	}

	async update(id: number, updateExpertDto: UpdateExpertDto, file?: Express.Multer.File) {
		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined
		if(!id) {
			if(fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		const {
			active,
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
			profile
		} = updateExpertDto

		const existingUser = await this.userRepository.findOne({
			where: { email },
			relations: ['experts']
		})

		if(existingUser && existingUser.experts[0]?.id !== id) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException(`El correo electrónico ${email} ya existe`)
		}

		try {
			const existingExpert = await this.expertRepository.findOne({
				where: { id },
				relations: ['strengtheningAreas']
			})

			if (!existingExpert) {
				if (fullPath) this.fileUploadService.deleteFile(fullPath)
				return { affected: 0 }
			}

			const strengtheningAreaEntities = await this.strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas || []),
			})

			existingExpert.firstName = firstName ?? existingExpert.firstName
			existingExpert.lastName = lastName ?? existingExpert.lastName
			existingExpert.email = email ?? existingExpert.email
			existingExpert.phone = phone ?? existingExpert.phone
			existingExpert.documentTypeId = documentTypeId ?? existingExpert.documentTypeId
			existingExpert.documentNumber = documentNumber ?? existingExpert.documentNumber
			existingExpert.photo = fullPath ?? existingExpert.photo
			existingExpert.consultorTypeId = consultorTypeId ?? existingExpert.consultorTypeId
			existingExpert.genderId = genderId ?? existingExpert.genderId
			existingExpert.experienceYears = experienceYears ?? existingExpert.experienceYears
			existingExpert.educationLevelId = educationLevelId ?? existingExpert.educationLevelId
			existingExpert.facebook = facebook ?? existingExpert.facebook
			existingExpert.instagram = instagram ?? existingExpert.instagram
			existingExpert.twitter = twitter ?? existingExpert.twitter
			existingExpert.website = website ?? existingExpert.website
			existingExpert.linkedin = linkedin ?? existingExpert.linkedin
			existingExpert.profile = profile ?? existingExpert.profile
			existingExpert.strengtheningAreas = strengtheningAreaEntities

			await this.expertRepository.save(existingExpert)

			await this.userRepository.update(existingExpert.userId, {
				active,
				name: firstName,
				email
			})

			return { affected: 1 }
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}

	async remove(id: number) {
		const existing = await this.expertRepository.findOneBy({ id })
		if (!existing) return { affected: 0 }

		const expertData = await this.expertRepository.findOne({
			select: { userId: true },
			where: { id }
		})

		const result = await this.expertRepository.delete(id)

		if(expertData) {
			await this.userRepository.delete(expertData.userId)
		}

		if (existing.photo) {
			this.fileUploadService.deleteFile(existing.photo)
		}

		return result
	}
}
