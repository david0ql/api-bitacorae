import { In } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { Business } from 'src/entities/Business'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { EconomicActivity } from 'src/entities/EconomicActivity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateBusinessDto } from './dto/create-business.dto'
import { UpdateBusinessDto } from './dto/update-business.dto'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import envVars from 'src/config/env'

@Injectable()
export class BusinessService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	async create(createBusinessDto: CreateBusinessDto, businessName: string, file?: Express.Multer.File) {
		const {
			socialReason,
			documentTypeId,
			documentNumber,
			address,
			phone,
			email,
			economicActivities,
			businessSizeId,
			numberOfEmployees,
			lastYearSales,
			twoYearsAgoSales,
			threeYearsAgoSales,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			positionId,
			hasFoundedBefore,
			observation,
			numberOfPeopleLeading,
			productStatusId,
			marketScopeId,
			businessPlan,
			businessSegmentation,
			strengtheningAreas,
			assignedHours,
			cohortId,
			diagnostic,
			password
		} = createBusinessDto

		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para crear el negocio')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('business', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const economicActivityRepository = businessDataSource.getRepository(EconomicActivity)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)
			const businessRepository = businessDataSource.getRepository(Business)

			const existingUser = await userRepository.findOne({ where: { email } })

			if(existingUser) {
				if (fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException('El correo electrónico ya existe')
			}

			const salt = bcrypt.genSaltSync(10)
			const hash = bcrypt.hashSync(password, salt)

			const newUser = await userRepository.save(
				userRepository.create({
					roleId: 4,
					name: socialReason,
					email,
					password: hash
				})
			)

			const economicActivityEntities = await economicActivityRepository.findBy({
				id: In(economicActivities)
			})

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas)
			})

			const savedBusiness = await businessRepository.save(
				businessRepository.create({
					userId: newUser.id,
					socialReason,
					documentTypeId,
					documentNumber,
					address,
					phone,
					email,
					economicActivities: economicActivityEntities,
					businessSizeId,
					numberOfEmployees,
					lastYearSales,
					twoYearsAgoSales,
					threeYearsAgoSales,
					facebook,
					instagram,
					twitter,
					website,
					linkedin,
					positionId,
					hasFoundedBefore,
					observation,
					numberOfPeopleLeading,
					productStatusId,
					marketScopeId,
					businessPlan,
					businessSegmentation,
					strengtheningAreas: strengtheningAreaEntities,
					assignedHours,
					cohortId,
					diagnostic,
					evidence: fullPath
				})
			)

			try {
				this.mailService.sendWelcomeEmail({
					name: socialReason,
					email,
					password
				}, businessName)
			} catch (e) {
				console.error('Error sending welcome email:', e)
			}

			return savedBusiness
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Business>> {
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					b.id AS id,
					b.social_reason AS socialReason,
					dt.name AS documentType,
					b.document_number AS documentNumber,
					DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
					IF(u.active = 1, 'Si', 'No') AS userActive,
					CONCAT(c.first_name, ' ', c.last_name, ' - ', b.email) AS userInfo,
					CONCAT(IFNULL(ROUND((SUM(CASE WHEN s.status_id = 3 THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END) / b.assigned_hours) * 100, 0), 0), '%') AS progress
				FROM
					business b
					INNER JOIN user u ON u.id = b.user_id
					INNER JOIN document_type dt ON dt.id = b.document_type_id
					LEFT JOIN contact_information c ON c.business_id = b.id
					LEFT JOIN accompaniment a ON a.business_id = b.id
					LEFT JOIN session s ON s.accompaniment_id = a.id
				GROUP BY b.id
				ORDER BY b.id ${order}
				LIMIT ${take} OFFSET ${skip}
			`

			const countSql = `
				SELECT COUNT(DISTINCT b.id) AS total
				FROM business b
				INNER JOIN user u ON u.id = b.user_id
				INNER JOIN document_type dt ON dt.id = b.document_type_id
				LEFT JOIN contact_information c ON c.business_id = b.id
			`

			const [items, countResult] = await Promise.all([
				businessDataSource.query(sql),
				businessDataSource.query(countSql)
			])

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
			const businessRepository = businessDataSource.getRepository(Business)
			return await businessRepository.find({
				select: { id: true, socialReason: true },
				where: { socialReason: filter }
			})
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findOne(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const business = await businessRepository.findOne({
				where: { id },
				relations: ['economicActivities', 'strengtheningAreas', 'marketScope', 'productStatus']
			})



			return business
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findName(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const business = await businessRepository.findOne({
				select: { id: true, socialReason: true },
				where: { id }
			})
			return {
				statusCode: 200,
				message: 'Success',
				data: business ? business.socialReason : null
			}
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async update(id: number, updateBusinessDto: UpdateBusinessDto, businessName: string, file?: Express.Multer.File) {
		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para actualizar el negocio')
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const economicActivityRepository = businessDataSource.getRepository(EconomicActivity)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const existingBusiness = await businessRepository.findOne({
				where: { id },
				relations: ['economicActivities', 'strengtheningAreas']
			})

			if (!existingBusiness) {
				throw new BadRequestException(`No se encontró un negocio con el ID ${id}`)
			}

		const fullPath = file ? this.fileUploadService.getFullPath('business', file.filename) : undefined

		// Handle the relations FIRST
		if (updateBusinessDto.economicActivities) {
			const economicActivityEntities = await economicActivityRepository.findBy({
				id: In(updateBusinessDto.economicActivities)
			})
			existingBusiness.economicActivities = economicActivityEntities
		}

		if (updateBusinessDto.strengtheningAreas) {
			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(updateBusinessDto.strengtheningAreas)
			})
			existingBusiness.strengtheningAreas = strengtheningAreaEntities
		}

		if (fullPath) {
			existingBusiness.evidence = fullPath
		}

		// Then assign the basic properties, excluding the relations
		const { economicActivities, strengtheningAreas, ...updateData } = updateBusinessDto
		Object.assign(existingBusiness, updateData)

		await businessRepository.save(existingBusiness)

		// Return with relations
		return await businessRepository.findOne({
			where: { id },
			relations: ['economicActivities', 'strengtheningAreas'],
			select: {
				id: true,
				userId: true,
				socialReason: true,
				documentTypeId: true,
				documentNumber: true,
				address: true,
				phone: true,
				email: true,
				businessSizeId: true,
				numberOfEmployees: true,
				lastYearSales: true,
				twoYearsAgoSales: true,
				threeYearsAgoSales: true,
				facebook: true,
				instagram: true,
				twitter: true,
				website: true,
				linkedin: true,
				positionId: true,
				hasFoundedBefore: true,
				observation: true,
				numberOfPeopleLeading: true,
				productStatusId: true,
				marketScopeId: true,
				businessPlan: true,
				businessSegmentation: true,
				assignedHours: true,
				cohortId: true,
				diagnostic: true,
				evidence: true,
				economicActivities: {
					id: true,
					name: true
				},
				strengtheningAreas: {
					id: true,
					name: true
				}
			}
		})
	} catch (e) {
		if (file) {
			const fullPath = this.fileUploadService.getFullPath('business', file.filename)
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
			const businessRepository = businessDataSource.getRepository(Business)

			// This is a soft delete operation - should be actually soft deleting
			// Not hard deleting. We should add "deletedAt" field to schema
			
			return await businessRepository.delete(id)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
