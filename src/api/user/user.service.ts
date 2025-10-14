import { In, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
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
import { DynamicEntityService } from 'src/services/dynamic-database/dynamic-entity.service'

import envVars from 'src/config/env'
import { MailService } from 'src/services/mail/mail.service'

@Injectable()
export class UserService {
	constructor(
		private readonly dynamicEntityService: DynamicEntityService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	async findOne(user: JwtUser, businessName: string) {
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
					CONCAT(?, '/', ?, '/user/', a.photo) AS photo,
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
					CONCAT(?, '/', ?, '/user/', a.photo) AS photo,
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
					CONCAT(?, '/', ?, '/user/', e.photo) AS photo,
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
					CONCAT(?, '/', ?, '/user/', ci.photo) AS photo,
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
					INNER JOIN contact_information ci ON ci.business_id = (
						SELECT b.id FROM business b WHERE b.user_id = u.id LIMIT 1
					)
					LEFT JOIN contact_information_strengthening_area_rel cisa ON cisa.contact_information_id = ci.id
					LEFT JOIN strengthening_area sa ON sa.id = cisa.strengthening_area_id
				WHERE u.id = ?
				GROUP BY u.id
			`
		}

		console.log('🔍 [USER SERVICE] findOne - roleId:', roleId, 'userId:', userId, 'sql length:', sql.length)

		return await this.dynamicEntityService.executeWithBusinessConnection(
			businessName,
			async (dataSource) => {
				const result = await dataSource.query(sql, [envVars.APP_URL, envVars.UPLOADS_DIR, userId])
				return result[0]
			}
		)
	}

	async changePassword(user: JwtUser, changePasswordDto: ChangePasswordDto, businessName: string) {
		const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto
		const { id: userId } = user

		if(newPassword !== confirmNewPassword) {
			throw new BadRequestException('Las contraseñas no coinciden')
		}

		if(currentPassword === newPassword) {
			throw new BadRequestException('La nueva contraseña debe ser diferente a la actual')
		}

		return await this.dynamicEntityService.executeWithRepository(
			businessName,
			User,
			async (userRepository) => {
				const currentUser = await userRepository.findOne({
					where: { id: userId },
					select: { password: true }
				})

				if(!currentUser) {
					throw new BadRequestException('Usuario no encontrado')
				}

				const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password)
				if(!isPasswordValid) {
					throw new BadRequestException('La contraseña actual es incorrecta')
				}

				const salt = bcrypt.genSaltSync(10)
				const hash = bcrypt.hashSync(newPassword, salt)

				return await userRepository.update(userId, { password: hash })
			}
		)
	}

	async changePasswordByAdmin(changePasswordByAdminDto: ChangePasswordByAdminDto, businessName: string) {
		const { id, role, newPassword, confirmNewPassword } = changePasswordByAdminDto

		if(newPassword !== confirmNewPassword) {
			throw new BadRequestException('Las contraseñas no coinciden')
		}

		if(![1,2,3,4].includes(role)) {
			throw new BadRequestException('No se puede cambiar la contraseña de este rol')
		}

		const salt = bcrypt.genSaltSync(10)
		const hash = bcrypt.hashSync(newPassword, salt)

		if(role === 1) {
			return this.dynamicEntityService.executeWithRepository(
				businessName,
				Admin,
				async (adminRepository) => {
					const existingAdmin = await adminRepository.findOne({
				where: { id },
				relations: ['user']
			})
			if(!existingAdmin) {
				throw new BadRequestException('Administrador no encontrado')
			}

			try {
				this.mailService.sendChangePasswordEmail({
					name: `${existingAdmin.firstName} ${existingAdmin.lastName}`,
					email: existingAdmin.user.email,
					password: newPassword
				}, businessName)

			} catch (e) {
				console.error('Error sending change password email:', e)
			}

					return this.dynamicEntityService.executeWithRepository(
						businessName,
						User,
						async (userRepository) => {
							return userRepository.update(existingAdmin.userId, { password: hash })
						}
					)
				}
			)
		}

		if(role === 2) {
			return this.dynamicEntityService.executeWithRepository(
				businessName,
				Auditor,
				async (auditorRepository) => {
					const existingAuditor = await auditorRepository.findOne({
				where: { id },
				relations: ['user']
			})
			if(!existingAuditor) {
				throw new BadRequestException('Auditor no encontrado')
			}

			try {
				this.mailService.sendChangePasswordEmail({
					name: `${existingAuditor.firstName} ${existingAuditor.lastName}`,
					email: existingAuditor.user.email,
					password: newPassword
						}, businessName)

			} catch (e) {
				console.error('Error sending change password email:', e)
			}

					return this.dynamicEntityService.executeWithRepository(
						businessName,
						User,
						async (userRepository) => {
							return userRepository.update(existingAuditor.userId, { password: hash })
						}
					)
				}
			)
		}

		try {
			if(role === 3) {
				return this.dynamicEntityService.executeWithRepository(
					businessName,
					Expert,
					async (expertRepository) => {
						const existingExpert = await expertRepository.findOne({
							where: { id },
							relations: ['user']
						})

						if(!existingExpert) {
							throw new BadRequestException('Experto no encontrado')
						}

						await this.mailService.sendChangePasswordEmail({
							name: `${existingExpert.firstName} ${existingExpert.lastName}`,
							email: existingExpert.user.email,
							password: newPassword
						}, businessName).catch(e => {
							console.error('Error sending change password email:', e)
						})

						return this.dynamicEntityService.executeWithRepository(
							businessName,
							User,
							async (userRepository) => {
								return userRepository.update(existingExpert.userId, { password: hash })
							}
						)
					}
				)
			}

			if(role === 4) {
				return this.dynamicEntityService.executeWithRepository(
					businessName,
					Business,
					async (businessRepository) => {
						const existingBusiness = await businessRepository.findOne({
							where: { id },
							relations: ['user']
						})

						if(!existingBusiness) {
							throw new BadRequestException('Empresa no encontrada')
						}

						await this.mailService.sendChangePasswordEmail({
							name: `${existingBusiness.socialReason}`,
							email: existingBusiness.user.email,
							password: newPassword
						}, businessName).catch(e => {
							console.error('Error sending change password email:', e)
						})

						return this.dynamicEntityService.executeWithRepository(
							businessName,
							User,
							async (userRepository) => {
								return userRepository.update(existingBusiness.userId, { password: hash })
							}
						)
					}
				)
			}
		} catch (error) {
			throw new BadRequestException('Error al cambiar la contraseña')
		}
	}

	async update(user: JwtUser, updateUserDto: UpdateUserDto, businessName: string, file?: Express.Multer.File) {
		const { id: userId, roleId } = user
		const { firstName, lastName, documentTypeId, documentNumber, phone, genderId, educationLevelId, experienceYears, facebook, instagram, twitter, website, linkedin, profile, strengtheningAreas } = updateUserDto

		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para actualizar el usuario')
		}

		let fullPath: string | null = null

		if(file) {
			fullPath = this.fileUploadService.getFullPath('user', file.filename)
		}

		try {
			if(roleId === 1) {
				return await this.dynamicEntityService.executeWithRepository(
					businessName,
					Admin,
					async (adminRepository) => {
						const existingAdmin = await adminRepository.findOne({
							where: { userId },
							relations: ['strengtheningAreas']
						})

						if(!existingAdmin) {
							if(fullPath) this.fileUploadService.deleteFile(fullPath)
							return { affected: 0 }
						}

						const strengtheningAreaEntities = await this.dynamicEntityService.executeWithRepository(
							businessName,
							StrengtheningArea,
							async (strengtheningAreaRepository) => {
								return await strengtheningAreaRepository.findBy({
									id: In(strengtheningAreas || [])
								})
							}
						)

						existingAdmin.firstName = firstName ?? existingAdmin.firstName
						existingAdmin.lastName = lastName ?? existingAdmin.lastName
						existingAdmin.documentTypeId = documentTypeId ?? existingAdmin.documentTypeId
						existingAdmin.documentNumber = documentNumber ?? existingAdmin.documentNumber
						existingAdmin.phone = phone ?? existingAdmin.phone
						existingAdmin.photo = fullPath ? fullPath.split('/').pop() || '' : existingAdmin.photo
						existingAdmin.genderId = genderId ?? existingAdmin.genderId
						existingAdmin.educationLevelId = educationLevelId ?? existingAdmin.educationLevelId
						existingAdmin.experienceYears = experienceYears ?? existingAdmin.experienceYears
						existingAdmin.facebook = facebook ?? existingAdmin.facebook
						existingAdmin.instagram = instagram ?? existingAdmin.instagram
						existingAdmin.twitter = twitter ?? existingAdmin.twitter
						existingAdmin.website = website ?? existingAdmin.website
						existingAdmin.linkedin = linkedin ?? existingAdmin.linkedin
						existingAdmin.profile = profile ?? existingAdmin.profile
						existingAdmin.strengtheningAreas = strengtheningAreaEntities

						return await adminRepository.save(existingAdmin)
					}
				)
			}

			if(roleId === 2) {
				return await this.dynamicEntityService.executeWithRepository(
					businessName,
					Auditor,
					async (auditorRepository) => {
						const existingAuditor = await auditorRepository.findOne({
							where: { userId },
							relations: ['strengtheningAreas']
						})

						if(!existingAuditor) {
							if(fullPath) this.fileUploadService.deleteFile(fullPath)
							return { affected: 0 }
						}

						const strengtheningAreaEntities = await this.dynamicEntityService.executeWithRepository(
							businessName,
							StrengtheningArea,
							async (strengtheningAreaRepository) => {
								return await strengtheningAreaRepository.findBy({
									id: In(strengtheningAreas || [])
								})
							}
						)

						existingAuditor.firstName = firstName ?? existingAuditor.firstName
						existingAuditor.lastName = lastName ?? existingAuditor.lastName
						existingAuditor.documentTypeId = documentTypeId ?? existingAuditor.documentTypeId
						existingAuditor.documentNumber = documentNumber ?? existingAuditor.documentNumber
						existingAuditor.phone = phone ?? existingAuditor.phone
						existingAuditor.photo = fullPath ? fullPath.split('/').pop() || '' : existingAuditor.photo
						existingAuditor.genderId = genderId ?? existingAuditor.genderId
						existingAuditor.educationLevelId = educationLevelId ?? existingAuditor.educationLevelId
						existingAuditor.experienceYears = experienceYears ?? existingAuditor.experienceYears
						existingAuditor.facebook = facebook ?? existingAuditor.facebook
						existingAuditor.instagram = instagram ?? existingAuditor.instagram
						existingAuditor.twitter = twitter ?? existingAuditor.twitter
						existingAuditor.website = website ?? existingAuditor.website
						existingAuditor.linkedin = linkedin ?? existingAuditor.linkedin
						existingAuditor.profile = profile ?? existingAuditor.profile
						existingAuditor.strengtheningAreas = strengtheningAreaEntities

						return await auditorRepository.save(existingAuditor)
					}
				)
			}

			if(roleId === 3) {
				return await this.dynamicEntityService.executeWithRepository(
					businessName,
					Expert,
					async (expertRepository) => {
						const existingExpert = await expertRepository.findOne({
							where: { userId },
							relations: ['strengtheningAreas']
						})

						if(!existingExpert) {
							if(fullPath) this.fileUploadService.deleteFile(fullPath)
							return { affected: 0 }
						}

						const strengtheningAreaEntities = await this.dynamicEntityService.executeWithRepository(
							businessName,
							StrengtheningArea,
							async (strengtheningAreaRepository) => {
								return await strengtheningAreaRepository.findBy({
									id: In(strengtheningAreas || [])
								})
							}
						)

						existingExpert.firstName = firstName ?? existingExpert.firstName
						existingExpert.lastName = lastName ?? existingExpert.lastName
						existingExpert.documentTypeId = documentTypeId ?? existingExpert.documentTypeId
						existingExpert.documentNumber = documentNumber ?? existingExpert.documentNumber
						existingExpert.phone = phone ?? existingExpert.phone
						existingExpert.photo = fullPath ? fullPath.split('/').pop() || '' : existingExpert.photo
						existingExpert.genderId = genderId ?? existingExpert.genderId
						existingExpert.educationLevelId = educationLevelId ?? existingExpert.educationLevelId
						existingExpert.experienceYears = experienceYears ?? existingExpert.experienceYears
						existingExpert.facebook = facebook ?? existingExpert.facebook
						existingExpert.instagram = instagram ?? existingExpert.instagram
						existingExpert.twitter = twitter ?? existingExpert.twitter
						existingExpert.website = website ?? existingExpert.website
						existingExpert.linkedin = linkedin ?? existingExpert.linkedin
						existingExpert.profile = profile ?? existingExpert.profile
						existingExpert.strengtheningAreas = strengtheningAreaEntities

						return await expertRepository.save(existingExpert)
					}
				)
			}

			if(roleId === 4) {
				return await this.dynamicEntityService.executeWithRepository(
					businessName,
					ContactInformation,
					async (contactInformationRepository) => {
						const businessId = await this.dynamicEntityService.executeWithRepository(
							businessName,
							Business,
							async (businessRepository) => {
								const business = await businessRepository.findOne({
									where: { userId },
									select: { id: true }
								})
								return business?.id
							}
						)

						if (!businessId) {
							if(fullPath) this.fileUploadService.deleteFile(fullPath)
							return { affected: 0 }
						}

						const existingContactInfo = await contactInformationRepository.findOne({
							where: { businessId },
							relations: ['strengtheningAreas']
						})

						if(!existingContactInfo) {
							if(fullPath) this.fileUploadService.deleteFile(fullPath)
							return { affected: 0 }
						}

						const strengtheningAreaEntities = await this.dynamicEntityService.executeWithRepository(
							businessName,
							StrengtheningArea,
							async (strengtheningAreaRepository) => {
								return await strengtheningAreaRepository.findBy({
									id: In(strengtheningAreas || [])
								})
							}
						)

						existingContactInfo.firstName = firstName ?? existingContactInfo.firstName
						existingContactInfo.lastName = lastName ?? existingContactInfo.lastName
						existingContactInfo.documentTypeId = documentTypeId ?? existingContactInfo.documentTypeId
						existingContactInfo.documentNumber = documentNumber ?? existingContactInfo.documentNumber
						existingContactInfo.phone = phone ?? existingContactInfo.phone
						existingContactInfo.photo = fullPath ? fullPath.split('/').pop() || '' : existingContactInfo.photo
						existingContactInfo.genderId = genderId ?? existingContactInfo.genderId
						existingContactInfo.educationLevelId = educationLevelId ?? existingContactInfo.educationLevelId
						existingContactInfo.experienceYears = experienceYears ?? existingContactInfo.experienceYears
						existingContactInfo.facebook = facebook ?? existingContactInfo.facebook
						existingContactInfo.instagram = instagram ?? existingContactInfo.instagram
						existingContactInfo.twitter = twitter ?? existingContactInfo.twitter
						existingContactInfo.website = website ?? existingContactInfo.website
						existingContactInfo.linkedin = linkedin ?? existingContactInfo.linkedin
						existingContactInfo.profile = profile ?? existingContactInfo.profile
						existingContactInfo.strengtheningAreas = strengtheningAreaEntities

						return await contactInformationRepository.save(existingContactInfo)
					}
				)
			}
		} catch (error) {
			if(fullPath) this.fileUploadService.deleteFile(fullPath)
			throw error
		}
	}
}
