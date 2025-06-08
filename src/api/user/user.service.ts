import { In, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { ContactInformation } from 'src/entities/ContactInformation'
import { Expert } from 'src/entities/Expert'
import { Business } from 'src/entities/Business'
import { Admin } from 'src/entities/Admin'
import { Auditor } from 'src/entities/Auditor'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

import { UpdateUserDto } from './dto/update-user.dto'
import { ChangePasswordDto } from './dto/change-password.dto'
import { ChangePasswordByAdminDto } from './dto/change-password-by-admin.dto'

import { JwtUser } from '../auth/interfaces/jwt-user.interface'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'

import envVars from 'src/config/env'

@Injectable()
export class UserService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,

		@InjectRepository(ContactInformation)
		private readonly contactInformationRepository: Repository<ContactInformation>,

		@InjectRepository(Expert)
		private readonly expertRepository: Repository<Expert>,

		@InjectRepository(Business)
		private readonly businessRepository: Repository<Business>,

		@InjectRepository(Admin)
		private readonly adminRepository: Repository<Admin>,

		@InjectRepository(Auditor)
		private readonly auditorRepository: Repository<Auditor>,

		@InjectRepository(StrengtheningArea)
		private readonly strengtheningAreaRepository: Repository<StrengtheningArea>,

		private readonly fileUploadService: FileUploadService
	) {}

	async findOne(user: JwtUser) {
		const { id: userId, roleId } = user

		let sql = ``

		if(roleId === 1) {
			sql = `
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
				WHERE u.id = ?
				GROUP BY u.id
			`
		}

		if(roleId === 2) {
			sql = `
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
				WHERE u.id = ?
				GROUP BY u.id
			`
		}

		if(roleId === 3) {
			sql = `
				SELECT
					u.id AS userId,
					u.email AS email,
					e.first_name AS firstName,
					e.last_name AS lastName,
					e.document_type_id AS documentTypeId,
					e.document_number AS documentNumber,
					e.phone AS phone,
					CONCAT(?, '/', e.photo) AS photo,
					e.gender_id AS genderId,
					e.education_level_id AS educationLevelId,
					e.experience_years AS experienceYears,
					e.facebook AS facebook,
					e.instagram AS instagram,
					e.twitter AS twitter,
					e.website AS website,
					e.linkedin AS linkedin,
					e.profile AS profile,
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
					INNER JOIN expert e ON e.user_id = u.id
					LEFT JOIN expert_strengthening_area_rel esa ON esa.expert_id = e.id
					LEFT JOIN strengthening_area sa ON sa.id = esa.strengthening_area_id
				WHERE u.id = ?
				GROUP BY u.id
			`
		}

		if(roleId === 4) {
			sql = `
				SELECT
					u.id AS userId,
					u.email AS email,
					ci.first_name AS firstName,
					ci.last_name AS lastName,
					ci.document_type_id AS documentTypeId,
					ci.document_number AS documentNumber,
					ci.phone AS phone,
					CONCAT(?, '/', ci.photo) AS photo,
					ci.gender_id AS genderId,
					ci.education_level_id AS educationLevelId,
					ci.experience_years AS experienceYears,
					ci.facebook AS facebook,
					ci.instagram AS instagram,
					ci.twitter AS twitter,
					ci.website AS website,
					ci.linkedin AS linkedin,
					ci.profile AS profile,
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
					INNER JOIN business b ON b.user_id = u.id
					LEFT JOIN contact_information ci ON ci.business_id = b.id
					LEFT JOIN contact_information_strengthening_area_rel cisa ON cisa.contact_information_id = ci.id
					LEFT JOIN strengthening_area sa ON sa.id = cisa.strengthening_area_id
				WHERE u.id = ?
				GROUP BY u.id
			`
		}

		const result = await this.userRepository.query(sql, [envVars.APP_URL, userId])

		if (!result?.length) return {}

		const row = result[0]

		return {
			...row,
			strengtheningAreas: row.strengtheningAreas ? JSON.parse(row.strengtheningAreas) : []
		}
	}

	async changePassword(user: JwtUser, changePasswordDto: ChangePasswordDto) {
		const { id: userId } = user
		const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto

		if(newPassword !== confirmNewPassword) {
			throw new BadRequestException('Las contraseñas no coinciden')
		}

		if(currentPassword === newPassword) {
			throw new BadRequestException('La nueva contraseña no puede ser igual a la actual')
		}

		const currentUser = await this.userRepository.findOne({ where: { id: userId } })
		if(!currentUser) {
			throw new BadRequestException('Usuario no encontrado')
		}

		const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
		if(!isPasswordValid) {
			throw new BadRequestException('La contraseña actual es incorrecta')
		}

		const salt = bcrypt.genSaltSync(10)
		const hash = bcrypt.hashSync(newPassword, salt)

		return await this.userRepository.update(userId, { password: hash })
	}

	async changePasswordByAdmin(changePasswordByAdminDto: ChangePasswordByAdminDto) {
		const { id, role, newPassword, confirmNewPassword } = changePasswordByAdminDto

		if(newPassword !== confirmNewPassword) {
			throw new BadRequestException('Las contraseñas no coinciden')
		}

		if(![3,4].includes(role)) {
			throw new BadRequestException('No se puede cambiar la contraseña de este rol')
		}

		if(role === 3) {
			const existingExpert = await this.expertRepository.findOne({ where: { id } })
			if(!existingExpert) {
				throw new BadRequestException('Experto no encontrado')
			}

			const salt = bcrypt.genSaltSync(10)
			const hash = bcrypt.hashSync(newPassword, salt)

			return await this.userRepository.update(existingExpert.userId, { password: hash })
		}

		if(role === 4) {
			const existingBusiness = await this.businessRepository.findOne({ where: { id } })
			if(!existingBusiness) {
				throw new BadRequestException('Empresa no encontrada')
			}

			const salt = bcrypt.genSaltSync(10)
			const hash = bcrypt.hashSync(newPassword, salt)

			return await this.userRepository.update(existingBusiness.userId, { password: hash })
		}
	}

	async update(user: JwtUser, updateUserDto: UpdateUserDto, file?: Express.Multer.File) {
		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined
		const { id: userId, roleId } = user

		const {
			email,
			firstName,
			lastName,
			documentTypeId,
			documentNumber,
			phone,
			genderId,
			educationLevelId,
			experienceYears,
			strengtheningAreas,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile
		} = updateUserDto

		const existingUser = await this.userRepository.findOne({ where: { email } })
		if(existingUser && existingUser.id !== userId) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException('El correo electrónico ya existe')
		}

		try {
			const strengtheningAreaEntities = await this.strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas || []),
			})

			if(roleId === 1) {
				const existingAdmin = await this.adminRepository.findOne({
					where: { userId },
					relations: ['strengtheningAreas']
				})

				if(!existingAdmin) {
					if (fullPath) this.fileUploadService.deleteFile(fullPath)
					throw new BadRequestException('Administrador no encontrado')
				}

				existingAdmin.firstName = firstName ?? existingAdmin.firstName
				existingAdmin.lastName = lastName ?? existingAdmin.lastName
				existingAdmin.documentTypeId = documentTypeId ?? existingAdmin.documentTypeId
				existingAdmin.documentNumber = documentNumber ?? existingAdmin.documentNumber
				existingAdmin.phone = phone ?? existingAdmin.phone
				existingAdmin.genderId = genderId ?? existingAdmin.genderId
				existingAdmin.educationLevelId = educationLevelId ?? existingAdmin.educationLevelId
				existingAdmin.experienceYears = experienceYears ?? existingAdmin.experienceYears
				existingAdmin.facebook = facebook ?? existingAdmin.facebook
				existingAdmin.instagram = instagram ?? existingAdmin.instagram
				existingAdmin.twitter = twitter ?? existingAdmin.twitter
				existingAdmin.website = website ?? existingAdmin.website
				existingAdmin.linkedin = linkedin ?? existingAdmin.linkedin
				existingAdmin.profile = profile ?? existingAdmin.profile
				existingAdmin.photo = fullPath ?? existingAdmin.photo
				existingAdmin.strengtheningAreas = strengtheningAreaEntities

				await this.adminRepository.save(existingAdmin)
				await this.userRepository.update(userId, { email })
			}

			if(roleId === 2) {
				const existingAuditor = await this.auditorRepository.findOne({
					where: { userId },
					relations: ['strengtheningAreas']
				})

				if(!existingAuditor) {
					if (fullPath) this.fileUploadService.deleteFile(fullPath)
					throw new BadRequestException('Auditor no encontrado')
				}

				existingAuditor.firstName = firstName ?? existingAuditor.firstName
				existingAuditor.lastName = lastName ?? existingAuditor.lastName
				existingAuditor.documentTypeId = documentTypeId ?? existingAuditor.documentTypeId
				existingAuditor.documentNumber = documentNumber ?? existingAuditor.documentNumber
				existingAuditor.phone = phone ?? existingAuditor.phone
				existingAuditor.genderId = genderId ?? existingAuditor.genderId
				existingAuditor.educationLevelId = educationLevelId ?? existingAuditor.educationLevelId
				existingAuditor.experienceYears = experienceYears ?? existingAuditor.experienceYears
				existingAuditor.facebook = facebook ?? existingAuditor.facebook
				existingAuditor.instagram = instagram ?? existingAuditor.instagram
				existingAuditor.twitter = twitter ?? existingAuditor.twitter
				existingAuditor.website = website ?? existingAuditor.website
				existingAuditor.linkedin = linkedin ?? existingAuditor.linkedin
				existingAuditor.profile = profile ?? existingAuditor.profile
				existingAuditor.photo = fullPath ?? existingAuditor.photo
				existingAuditor.strengtheningAreas = strengtheningAreaEntities

				await this.auditorRepository.save(existingAuditor)
				await this.userRepository.update(userId, { email })
			}

			if(roleId === 3) {
				const existingExpert = await this.expertRepository.findOne({
					where: { userId },
					relations: ['strengtheningAreas']
				})

				if(!existingExpert) {
					if (fullPath) this.fileUploadService.deleteFile(fullPath)
					throw new BadRequestException('Experto no encontrado')
				}

				existingExpert.firstName = firstName ?? existingExpert.firstName
				existingExpert.lastName = lastName ?? existingExpert.lastName
				existingExpert.documentTypeId = documentTypeId ?? existingExpert.documentTypeId
				existingExpert.documentNumber = documentNumber ?? existingExpert.documentNumber
				existingExpert.phone = phone ?? existingExpert.phone
				existingExpert.genderId = genderId ?? existingExpert.genderId
				existingExpert.educationLevelId = educationLevelId ?? existingExpert.educationLevelId
				existingExpert.experienceYears = experienceYears ?? existingExpert.experienceYears
				existingExpert.facebook = facebook ?? existingExpert.facebook
				existingExpert.instagram = instagram ?? existingExpert.instagram
				existingExpert.twitter = twitter ?? existingExpert.twitter
				existingExpert.website = website ?? existingExpert.website
				existingExpert.linkedin = linkedin ?? existingExpert.linkedin
				existingExpert.profile = profile ?? existingExpert.profile
				existingExpert.photo = fullPath ?? existingExpert.photo
				existingExpert.strengtheningAreas = strengtheningAreaEntities

				await this.expertRepository.save(existingExpert)
				await this.userRepository.update(userId, { email })
			}

			if(roleId === 4) {
				const business = await this.userRepository.findOne({where: { id: userId }, relations: ['businesses'] })
				if(!business) {
					if (fullPath) this.fileUploadService.deleteFile(fullPath)
					throw new BadRequestException('Empresa no encontrada')
				}

				const existingContactInfo = await this.contactInformationRepository.findOne({
					where: { businessId: business.businesses[0].id },
					relations: ['strengtheningAreas']
				})

				if(!existingContactInfo) {
					if (fullPath) this.fileUploadService.deleteFile(fullPath)
					throw new BadRequestException('Información de contacto no encontrada')
				}

				existingContactInfo.firstName = firstName ?? existingContactInfo.firstName
				existingContactInfo.lastName = lastName ?? existingContactInfo.lastName
				existingContactInfo.documentTypeId = documentTypeId ?? existingContactInfo.documentTypeId
				existingContactInfo.documentNumber = documentNumber ?? existingContactInfo.documentNumber
				existingContactInfo.phone = phone ?? existingContactInfo.phone
				existingContactInfo.genderId = genderId ?? existingContactInfo.genderId
				existingContactInfo.educationLevelId = educationLevelId ?? existingContactInfo.educationLevelId
				existingContactInfo.experienceYears = experienceYears ?? existingContactInfo.experienceYears
				existingContactInfo.facebook = facebook ?? existingContactInfo.facebook
				existingContactInfo.instagram = instagram ?? existingContactInfo.instagram
				existingContactInfo.twitter = twitter ?? existingContactInfo.twitter
				existingContactInfo.website = website ?? existingContactInfo.website
				existingContactInfo.linkedin = linkedin ?? existingContactInfo.linkedin
				existingContactInfo.profile = profile ?? existingContactInfo.profile
				existingContactInfo.photo = fullPath ?? existingContactInfo.photo
				existingContactInfo.strengtheningAreas = strengtheningAreaEntities

				await this.contactInformationRepository.save(existingContactInfo)
				await this.userRepository.update(userId, { email })
			}

			return { affected: 1 }

		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}
}
