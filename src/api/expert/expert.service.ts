import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { Expert } from 'src/entities/Expert'
import { ConsultorType } from 'src/entities/ConsultorType'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateExpertDto } from './dto/create-expert.dto'
import { UpdateExpertDto } from './dto/update-expert.dto'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'

import envVars from 'src/config/env'

@Injectable()
export class ExpertService {
	constructor(
		@InjectRepository(Expert)
		private readonly expertRepository: Repository<Expert>,

		@InjectRepository(User)
		private readonly userRepository: Repository<User>,

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
			strengtheningAreaId,
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
				strengtheningAreaId,
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

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Expert>> {
		const queryBuilder = this.expertRepository
			.createQueryBuilder('e')
			.select([
				'e.id AS id',
				'e.userId AS userId',
				'e.firstName AS firstName',
				'e.lastName AS lastName',
				'e.email AS email',
				'e.phone AS phone',
				'e.documentTypeId AS documentTypeId',
				'e.documentNumber AS documentNumber',
				'CONCAT(:appUrl, "/", e.photo) AS photo',
				'e.consultorTypeId AS consultorTypeId',
				'consultorType.name AS consultorTypeName',
				'e.genderId AS genderId',
				'e.experienceYears AS experienceYears',
				'e.strengtheningAreaId AS strengtheningAreaId',
				'e.educationLevelId AS educationLevelId',
				'e.facebook AS facebook',
				'e.instagram AS instagram',
				'e.twitter AS twitter',
				'e.website AS website',
				'e.linkedin AS linkedin',
				'e.profile AS profile',
				'user.active AS active',
				`IF(user.active = 1, 'Si', 'No') AS userActive`
			])
			.innerJoin('e.user', 'user')
			.innerJoin('e.consultorType', 'consultorType')
			.orderBy('e.id', pageOptionsDto.order)
			.skip(pageOptionsDto.skip)
			.take(pageOptionsDto.take)
			.setParameters({appUrl: envVars.APP_URL})

		const [items, totalCount] = await Promise.all([
			queryBuilder.getRawMany(),
			queryBuilder.getCount()
		])

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
		return new PageDto(items, pageMetaDto)
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
			.setParameters({appUrl: envVars.APP_URL})
			.getRawMany()

		return experts || []
	}

	async findOne(id: number) {
		if(!id) return {}

		const expert = await this.expertRepository
			.createQueryBuilder('e')
			.select([
				'e.id AS id',
				'e.userId AS userId',
				'e.firstName AS firstName',
				'e.lastName AS lastName',
				'e.email AS email',
				'e.phone AS phone',
				'e.documentTypeId AS documentTypeId',
				'documentType.name AS documentTypeName',
				'e.documentNumber AS documentNumber',
				'CONCAT(:appUrl, "/", e.photo) AS photo',
				'e.consultorTypeId AS consultorTypeId',
				'consultorType.name AS consultorTypeName',
				'e.genderId AS genderId',
				'gender.name AS genderName',
				'e.experienceYears AS experienceYears',
				'e.strengtheningAreaId AS strengtheningAreaId',
				'e.educationLevelId AS educationLevelId',
				'strengtheningArea.name AS strengtheningAreaName',
				'educationLevel.name AS educationLevelName',
				'e.facebook AS facebook',
				'e.instagram AS instagram',
				'e.twitter AS twitter',
				'e.website AS website',
				'e.linkedin AS linkedin',
				'e.profile AS profile',
				'user.active AS active'
			])
			.innerJoin('e.user', 'user')
			.innerJoin('e.consultorType', 'consultorType')
			.innerJoin('e.documentType', 'documentType')
			.innerJoin('e.gender', 'gender')
			.innerJoin('e.strengtheningArea', 'strengtheningArea')
			.innerJoin('e.educationLevel', 'educationLevel')
			.where('e.id = :id', { id })
			.setParameters({appUrl: envVars.APP_URL})
			.getRawOne()

		return expert || {}
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
			strengtheningAreaId,
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
			const result = await this.expertRepository.update(id, {
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
				strengtheningAreaId,
				educationLevelId,
				facebook,
				instagram,
				twitter,
				website,
				linkedin,
				profile
			})

			const expertData = await this.expertRepository.findOne({
				select: { userId: true },
				where: { id }
			})

			if(expertData) {
				await this.userRepository.update(expertData.userId, {
					active,
					name: firstName,
					email
				})
			}

			return result
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
