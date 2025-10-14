import { In, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { Admin } from 'src/entities/Admin'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { UpdateAdminDto } from './dto/update-admin.dto'

import { JwtUser } from '../auth/interfaces/jwt-user.interface'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'

import envVars from 'src/config/env'
import { MailService } from 'src/services/mail/mail.service'
import { CreateAdminDto } from './dto/create-admin.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'

@Injectable()
export class AdminService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	async create(createAdminDto: CreateAdminDto, businessName: string, file?: Express.Multer.File) {
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
		} = createAdminDto

		const fullPath = file ? this.fileUploadService.getFullPath('admin', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const adminRepository = businessDataSource.getRepository(Admin)
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
				roleId: 1,
				name: `${firstName} ${lastName}`,
				email,
				password: hash
			})

			const newUser = await userRepository.save(user)

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas || [])
			})

			const admin = adminRepository.create({
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

			const savedAdmin = await adminRepository.save(admin)

			try {
				this.mailService.sendWelcomeEmail({
					name: `${firstName} ${lastName}`,
					email,
					password
				}, businessName)
			} catch (e) {
				console.error('Error sending welcome email:', e)
			}

			return savedAdmin
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(user: JwtUser, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Admin>> {
		const { id: userId } = user

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const adminRepository = businessDataSource.getRepository(Admin)

			const queryBuilder = adminRepository.createQueryBuilder('a')
				.select([
					'a.id AS id',
					`CONCAT(a.firstName, ' ', a.lastName) AS name`,
					'a.documentNumber AS document',
					'a.phone AS phone',
					'u.email AS email',
				])
				.innerJoin('a.user', 'u')
				.where('a.userId != :userId', { userId })
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
			const adminRepository = businessDataSource.getRepository(Admin)

			const [admin] = await adminRepository.query(`
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
					INNER JOIN admin a ON a.user_id = u.id
					LEFT JOIN admin_strengthening_area_rel asa ON asa.admin_id = a.id
					LEFT JOIN strengthening_area sa ON sa.id = asa.strengthening_area_id
				WHERE a.id = ?
				GROUP BY u.id
			`, [envVars.APP_URL, id])

			if (!admin) return {}

			return {
				...admin,
				strengtheningAreas: admin.strengtheningAreas ? JSON.parse(admin.strengtheningAreas) : []
			}
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateAdminDto: UpdateAdminDto, businessName: string, file?: Express.Multer.File) {
		const fullPath = file ? this.fileUploadService.getFullPath('admin', file.filename) : undefined
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
		} = updateAdminDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const adminRepository = businessDataSource.getRepository(Admin)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const existingUser = await userRepository.findOne({
				where: { email },
				relations: ['admin']
			})

			if(existingUser && existingUser.admin?.id !== id) {
				if(fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException(`El correo electrónico ${email} ya existe`)
			}

			const existingAdmin = await adminRepository.findOne({
				where: { id },
				relations: ['strengtheningAreas']
			})

			if (!existingAdmin) {
				if (fullPath) this.fileUploadService.deleteFile(fullPath)
				return { affected: 0 }
			}

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas || []),
			})

			existingAdmin.firstName = firstName ?? existingAdmin.firstName
			existingAdmin.lastName = lastName ?? existingAdmin.lastName
			existingAdmin.phone = phone ?? existingAdmin.phone
			existingAdmin.documentTypeId = documentTypeId ?? existingAdmin.documentTypeId
			existingAdmin.documentNumber = documentNumber ?? existingAdmin.documentNumber
			existingAdmin.photo = fullPath ?? existingAdmin.photo
			existingAdmin.genderId = genderId ?? existingAdmin.genderId
			existingAdmin.experienceYears = experienceYears ?? existingAdmin.experienceYears
			existingAdmin.educationLevelId = educationLevelId ?? existingAdmin.educationLevelId
			existingAdmin.facebook = facebook ?? existingAdmin.facebook
			existingAdmin.instagram = instagram ?? existingAdmin.instagram
			existingAdmin.twitter = twitter ?? existingAdmin.twitter
			existingAdmin.website = website ?? existingAdmin.website
			existingAdmin.linkedin = linkedin ?? existingAdmin.linkedin
			existingAdmin.profile = profile ?? existingAdmin.profile
			existingAdmin.strengtheningAreas = strengtheningAreaEntities

			await adminRepository.save(existingAdmin)

			await userRepository.update(existingAdmin.userId, {
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
			const adminRepository = businessDataSource.getRepository(Admin)

			const existingAdmin = await adminRepository.findOne({ where: { id } })
			if (!existingAdmin) return { affected: 0 }

			const adminData = await adminRepository.findOne({
				select: { userId: true },
				where: { id }
			})

			const result = await adminRepository.delete(id)

			if(adminData) {
				await userRepository.delete(adminData.userId)
			}

			if (existingAdmin.photo) {
				this.fileUploadService.deleteFile(existingAdmin.photo)
			}

			return result
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
