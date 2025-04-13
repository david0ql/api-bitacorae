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

@Injectable()
export class BusinessService {
	constructor(
		@InjectRepository(Business)
		private readonly businessRepository: Repository<Business>,

		@InjectRepository(User)
		private readonly userRepository: Repository<User>,

		private readonly dataSource: DataSource
	) {}

	async create(createBusinessDto: CreateBusinessDto) {
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
			evidence,
			password
		} = createBusinessDto

		const existingUser = await this.userRepository.findOne({ where: { email } })
		if(existingUser) throw new BadRequestException('Email already exists')

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
			evidence
		})

		return this.businessRepository.save(business)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Business>> {
		const { take, skip, order } = pageOptionsDto

		const sql = `
			SELECT
				b.id AS id,
				b.social_reason AS socialReason,
				b.document_type_id AS documentTypeId,
				b.document_number AS documentNumber,
				b.created_at AS createdAt,
				u.active AS userActive,
				CONCAT(c.first_name, ' ', c.last_name, ' - ', b.email) AS userInfo,
				IFNULL(ROUND((SUM(CASE WHEN s.status_id = 3 THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END) / b.assigned_hours) * 100, 2), 0) AS progress
			FROM
				business b
				INNER JOIN user u ON u.id = b.user_id
				LEFT JOIN contact_information c ON c.business_id = b.id
				LEFT JOIN accompaniment a ON a.business_id = b.id
				LEFT JOIN session s ON s.accompaniment_id = a.id
			GROUP BY b.id
			ORDER BY b.id ${order}
			LIMIT ${take} OFFSET ${skip}
		`

		const countSql = `SELECT COUNT(DISTINCT b.id) as total FROM business b`

		const [items, countResult] = await Promise.all([
			this.dataSource.query(sql),
			this.dataSource.query(countSql)
		])

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findOne(id: number) {
		if(!id) return {}

		const business = await this.businessRepository.findOne({ where: { id } })

		return business || {}
	}

	async update(id: number, updateBusinessDto: UpdateBusinessDto) {
		if(!id) return { affected: 0 }

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
			diagnostic,
			evidence
		} = updateBusinessDto

		if(email) {
			const existingUser = await this.userRepository.findOne({ where: { email } })
			if(existingUser && existingUser.id != id) {
				throw new BadRequestException('Email already exists')
			}
		}

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
			evidence
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
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		const business = await this.businessRepository.findOne({
			select: { userId: true },
			where: { id }
		})

		const result = await this.businessRepository.delete(id)

		if(business) {
			await this.userRepository.delete(business.userId)
		}

		return result
	}
}
