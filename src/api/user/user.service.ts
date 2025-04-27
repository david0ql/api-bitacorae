import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { ContactInformation } from 'src/entities/ContactInformation'
import { Expert } from 'src/entities/Expert'
import { Admin } from 'src/entities/Admin'

import { UpdateUserDto } from './dto/update-user.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

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

		@InjectRepository(Admin)
		private readonly adminRepository: Repository<Admin>,

		private readonly fileUploadService: FileUploadService
	) {}

	async findOne(user: JwtUser) {
		const { id: userId, roleId } = user

		if(roleId === 1) {
			return await this.userRepository.createQueryBuilder('u')
				.select([
					'u.id AS userId',
					'u.email AS email',
					'a.firstName AS firstName',
					'a.lastName AS lastName',
					'a.documentTypeId AS documentTypeId',
					'a.documentNumber AS documentNumber',
					'a.phone AS phone',
					'CONCAT(:appUrl, "/", a.photo) AS photo',
					'a.genderId AS genderId',
					'a.educationLevelId AS educationLevelId',
					'a.experienceYears AS experienceYears',
					'a.strengtheningAreaId AS strengtheningAreaId',
					'a.facebook AS facebook',
					'a.instagram AS instagram',
					'a.twitter AS twitter',
					'a.website AS website',
					'a.linkedin AS linkedin',
					'a.profile AS profile'
				])
				.innerJoin('u.admin', 'a')
				.where('u.id = :userId', { userId })
				.setParameters({ appUrl: envVars.APP_URL })
				.getRawOne() || {}
		}

		if(roleId === 3) {
			return await this.userRepository.createQueryBuilder('u')
				.select([
					'u.id AS userId',
					'u.email AS email',
					'ci.firstName AS firstName',
					'ci.lastName AS lastName',
					'ci.documentTypeId AS documentTypeId',
					'ci.documentNumber AS documentNumber',
					'ci.phone AS phone',
					'CONCAT(:appUrl, "/", ci.photo) AS photo',
					'ci.genderId AS genderId',
					'ci.educationLevelId AS educationLevelId',
					'ci.experienceYears AS experienceYears',
					'ci.strengtheningAreaId AS strengtheningAreaId',
					'ci.facebook AS facebook',
					'ci.instagram AS instagram',
					'ci.twitter AS twitter',
					'ci.website AS website',
					'ci.linkedin AS linkedin',
					'ci.profile AS profile'
				])
				.innerJoin('u.businesses', 'b')
				.leftJoin('b.contactInformations', 'ci')
				.where('u.id = :userId', { userId })
				.setParameters({ appUrl: envVars.APP_URL })
				.getRawOne() || {}
		}

		if(roleId === 4) {
			return await this.userRepository.createQueryBuilder('u')
				.select([
					'u.id AS userId',
					'u.email AS email',
					'e.firstName AS firstName',
					'e.lastName AS lastName',
					'e.documentTypeId AS documentTypeId',
					'e.documentNumber AS documentNumber',
					'e.phone AS phone',
					'CONCAT(:appUrl, "/", e.photo) AS photo',
					'e.genderId AS genderId',
					'e.educationLevelId AS educationLevelId',
					'e.experienceYears AS experienceYears',
					'e.strengtheningAreaId AS strengtheningAreaId',
					'e.facebook AS facebook',
					'e.instagram AS instagram',
					'e.twitter AS twitter',
					'e.website AS website',
					'e.linkedin AS linkedin',
					'e.profile AS profile'
				])
				.innerJoin('u.experts', 'e')
				.where('u.id = :userId', { userId })
				.setParameters({ appUrl: envVars.APP_URL })
				.getRawOne() || {}
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
			strengtheningAreaId,
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
			if(roleId === 1) {
				const existingAdmin = await this.adminRepository.findOne({ where: { userId } })
				if(!existingAdmin) {
					if (fullPath) {
						this.fileUploadService.deleteFile(fullPath)
					}
					throw new BadRequestException('Administrador no encontrado')
				}

				await this.adminRepository.update(existingAdmin.id, {
					firstName,
					lastName,
					documentTypeId,
					documentNumber,
					phone,
					genderId,
					educationLevelId,
					experienceYears,
					strengtheningAreaId,
					facebook,
					instagram,
					twitter,
					website,
					linkedin,
					profile,
					photo: fullPath
				})

				await this.userRepository.update(userId, { email })
			}

			if(roleId === 3) {
				const bussiness = await this.userRepository.findOne({ where: { id: userId }, relations: ['businesses'] })
				if(!bussiness) {
					if (fullPath) {
						this.fileUploadService.deleteFile(fullPath)
					}
					throw new BadRequestException('Empresa no encontrada')
				}

				const existingContactInfo = await this.contactInformationRepository.findOne({ where: { businessId: bussiness.businesses[0].id } })
				if(!existingContactInfo) {
					if (fullPath) {
						this.fileUploadService.deleteFile(fullPath)
					}
					throw new BadRequestException('Información de contacto no encontrada')
				}

				await this.contactInformationRepository.update(existingContactInfo.id, {
					documentTypeId,
					documentNumber,
					phone,
					genderId,
					educationLevelId,
					experienceYears,
					strengtheningAreaId,
					facebook,
					instagram,
					twitter,
					website,
					linkedin,
					profile,
					photo: fullPath
				})

				await this.userRepository.update(userId, { email })
			}

			if(roleId === 4) {
				const existingExpert = await this.expertRepository.findOne({ where: { userId } })
				if(!existingExpert) {
					if (fullPath) {
						this.fileUploadService.deleteFile(fullPath)
					}
					throw new BadRequestException('Experto no encontrado')
				}

				await this.expertRepository.update(existingExpert.id, {
					firstName,
					lastName,
					documentTypeId,
					documentNumber,
					phone,
					genderId,
					educationLevelId,
					experienceYears,
					strengtheningAreaId,
					facebook,
					instagram,
					twitter,
					website,
					linkedin,
					profile,
					photo: fullPath
				})

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
