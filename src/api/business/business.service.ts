import { DataSource, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { User } from 'src/entities/User'
import { Business } from 'src/entities/Business'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateBusinessDto } from './dto/create-business.dto'
import { UpdateBusinessDto } from './dto/update-business.dto'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'

import envVars from 'src/config/env'

@Injectable()
export class BusinessService {
	constructor(
		@InjectRepository(Business)
		private readonly businessRepository: Repository<Business>,

		@InjectRepository(User)
		private readonly userRepository: Repository<User>,

		private readonly dataSource: DataSource,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	async create(createBusinessDto: CreateBusinessDto, file?: Express.Multer.File) {
		const {
			socialReason,
			documentTypeId,
			documentNumber,
			address,
			phone,
			email,
			economicActivityId,
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
			strengtheningAreaId,
			assignedHours,
			cohortId,
			diagnostic,
			password
		} = createBusinessDto

		const fullPath = file ? this.fileUploadService.getFullPath('business', file.filename) : undefined

		const existingUser = await this.userRepository.findOne({ where: { email } })
		if(existingUser) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException('El correo electrónico ya existe')
		}

		try {
			const salt = bcrypt.genSaltSync(10)
			const hash = bcrypt.hashSync(password, salt)

			const user = this.userRepository.create({
				roleId: 4,
				name: socialReason,
				email,
				password: hash
			})

			const newUser = await this.userRepository.save(user)

			const business = this.businessRepository.create({
				userId: newUser.id,
				socialReason,
				documentTypeId,
				documentNumber,
				address,
				phone,
				email,
				economicActivityId,
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
				strengtheningAreaId,
				assignedHours,
				cohortId,
				diagnostic,
				evidence: fullPath
			})
			const savedBusiness = await this.businessRepository.save(business)

			try {
				this.mailService.sendWelcomeEmail({
					name: socialReason,
					email,
					password
				})
			} catch (e) {
				console.error('Error sending welcome email:', e)
			}

			return savedBusiness
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Business>> {
		const { take, skip, order } = pageOptionsDto

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

		const countSql = `SELECT COUNT(DISTINCT b.id) AS total FROM business b`

		const [items, countResult] = await Promise.all([
			this.dataSource.query(sql),
			this.dataSource.query(countSql)
		])

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findAllByFilter(filter: string) {
		if(!filter) return []

		const business = await this.businessRepository
			.createQueryBuilder('b')
			.select([
				'b.id AS value',
				'CONCAT(b.social_reason, " - ", b.email) AS label'
			])
			.innerJoin('b.user', 'user')
			.where('b.social_reason LIKE :filter OR b.email LIKE :filter', { filter: `%${filter}%` })
			.andWhere('user.active = 1')
			.take(10)
			.setParameters({appUrl: envVars.APP_URL})
			.getRawMany()

		return business || []
	}

	async findOne(id: number) {
		if(!id) return {}

		const business = await this.businessRepository
			.createQueryBuilder('b')
			.select([
				'b.id AS id',
				'b.social_reason AS socialReason',
				'b.document_type_id AS documentTypeId',
				'b.document_number AS documentNumber',
				'b.address AS address',
				'b.phone AS phone',
				'b.email AS email',
				'b.economic_activity_id AS economicActivityId',
				'economicActivity.name AS economicActivityName',
				'b.business_size_id AS businessSizeId',
				'b.number_of_employees AS numberOfEmployees',
				'b.last_year_sales AS lastYearSales',
				'b.two_years_ago_sales AS twoYearsAgoSales',
				'b.three_years_ago_sales AS threeYearsAgoSales',
				'b.facebook AS facebook',
				'b.instagram AS instagram',
				'b.twitter AS twitter',
				'b.website AS website',
				'b.linkedin AS linkedin',
				'b.position_id AS positionId',
				'b.has_founded_before AS hasFoundedBefore',
				'b.observation AS observation',
				'b.number_of_people_leading AS numberOfPeopleLeading',
				'b.product_status_id AS productStatusId',
				'productStatus.name AS productStatusName',
				'b.market_scope_id AS marketScopeId',
				'marketScope.name AS marketScopeName',
				'b.business_plan AS businessPlan',
				'b.business_segmentation AS businessSegmentation',
				'b.strengthening_area_id AS strengtheningAreaId',
				'strengtheningArea.name AS strengtheningAreaName',
				'b.assigned_hours AS assignedHours',
				'b.cohort_id AS cohortId',
				'b.diagnostic AS diagnostic',
				'CONCAT(:appUrl, "/", b.evidence) AS evidence'
			])
			.where('b.id = :id', { id })
			.innerJoin('b.strengtheningArea', 'strengtheningArea')
			.innerJoin('b.economicActivity', 'economicActivity')
			.innerJoin('b.marketScope', 'marketScope')
			.innerJoin('b.productStatus', 'productStatus')
			.setParameters({appUrl: envVars.APP_URL})
			.getRawOne()

		return business || {}
	}

	async update(id: number, updateBusinessDto: UpdateBusinessDto, file?: Express.Multer.File) {
		const fullPath = file ? this.fileUploadService.getFullPath('business', file.filename) : undefined
		if(!id) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		const {
			active,
			socialReason,
			documentTypeId,
			documentNumber,
			address,
			phone,
			email,
			economicActivityId,
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
			strengtheningAreaId,
			assignedHours,
			cohortId,
			diagnostic
		} = updateBusinessDto

		if(email) {
			const existingUser = await this.userRepository.findOne({
				where: { email },
				relations: ['businesses']
			})
			if(existingUser && existingUser.businesses[0]?.id !== id) {
				if (fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException('El correo electrónico ya existe')
			}
		}

		try {
			const result = this.businessRepository.update(id, {
				socialReason,
				documentTypeId,
				documentNumber,
				address,
				phone,
				email,
				economicActivityId,
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
				strengtheningAreaId,
				assignedHours,
				cohortId,
				diagnostic,
				evidence: fullPath
			})

			const businessData = await this.businessRepository.findOne({
				select: { userId: true },
				where: { id }
			})

			if(businessData) {
				await this.userRepository.update(businessData.userId, {
					active,
					name: socialReason,
					email
				})
			}

			return { result }
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}

	async remove(id: number) {
		const existing = await this.businessRepository.findOneBy({ id })
		if (!existing) return { affected: 0 }

		try {
			const business = await this.businessRepository.findOne({
				select: { userId: true },
				where: { id }
			})

			const result = await this.businessRepository.delete(id)

			if(business) {
				await this.userRepository.delete(business.userId)
			}

			if (existing.evidence) {
				this.fileUploadService.deleteFile(existing.evidence)
			}

			return result
		} catch (e) {
			throw new Error(`No se pudo eliminar la empresa con id ${id}`)
		}
	}
}
