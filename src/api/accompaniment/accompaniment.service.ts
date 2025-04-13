import { DataSource, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Accompaniment } from 'src/entities/Accompaniment'
import { Business } from 'src/entities/Business'
import { Expert } from 'src/entities/Expert'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateAccompanimentDto } from './dto/create-accompaniment.dto'
import { UpdateAccompanimentDto } from './dto/update-accompaniment.dto'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'
@Injectable()
export class AccompanimentService {
	constructor(
		@InjectRepository(Accompaniment)
		private readonly accompanimentRepository: Repository<Accompaniment>,

		@InjectRepository(Business)
		private readonly businessRepository: Repository<Business>,

		@InjectRepository(Expert)
		private readonly expertRepository: Repository<Expert>,

		@InjectRepository(StrengtheningArea)
		private readonly strengtheningAreaRepository: Repository<StrengtheningArea>,

		private readonly dataSource: DataSource
	) {}

	async create(createAccompanimentDto: CreateAccompanimentDto) {
		const {
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		} = createAccompanimentDto

		const business = await this.businessRepository.findOne({ where: { id: businessId } })
		if (!business) {
			throw new BadRequestException(`Business with id ${businessId} not found`)
		}

		const expert = await this.expertRepository.findOne({ where: { id: expertId } })
		if (!expert) {
			throw new BadRequestException(`Expert with id ${expertId} not found`)
		}

		const strengtheningArea = await this.strengtheningAreaRepository.findOne({ where: { id: strengtheningAreaId } })
		if (!strengtheningArea) {
			throw new BadRequestException(`Strengthening area with id ${strengtheningAreaId} not found`)
		}

		const existingAccompaniment = await this.accompanimentRepository.findOne({
			where: { businessId, expertId }
		})

		if (existingAccompaniment) {
			throw new BadRequestException(`Business with id ${businessId} is already accompanied by expert with id ${expertId}`)
		}

		const accompaniment = this.accompanimentRepository.create({
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		})

		return this.accompanimentRepository.save(accompaniment)
	}

	async findAll(user: JwtUser, pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		const { id, roleId } = user
		const { take, skip, order } = pageOptionsDto

		let whereConditions: string[] = []
		let params: any[] = []

		if (roleId === 2) {
			const expert = await this.expertRepository.findOne({ where: { userId: id }, select: ['id'] })
			if (!expert) throw new BadRequestException(`Expert with userId ${id} not found`)
			whereConditions.push(`a.expert_id = ?`)
			params.push(expert.id)
		}

		if (roleId === 4) {
			const business = await this.businessRepository.findOne({ where: { userId: id }, select: ['id'] })
			if (!business) throw new BadRequestException(`Business with userId ${id} not found`)
			whereConditions.push(`b.id = ?`)
			params.push(business.id)
		}

		const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : ''

		const sql = `
			SELECT
				b.id AS id,
				b.social_reason AS socialReason,
				CONCAT(c.first_name, ' ', c.last_name) AS name,
				bs.name AS size,
				sa.name AS strengthening,
				b.assigned_hours AS assignedHours,
				IFNULL(COUNT(s.id), 0) AS scheduledSessions,
				IFNULL(ROUND(SUM(CASE WHEN s.status_id = 3 THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)), 0) AS completedHours
			FROM
				business b
				INNER JOIN business_size bs ON bs.id = b.business_size_id
				INNER JOIN strengthening_area sa ON sa.id = b.strengthening_area_id
				LEFT JOIN contact_information c ON c.business_id = b.id
				LEFT JOIN accompaniment a ON a.business_id = b.id
				LEFT JOIN session s ON s.accompaniment_id = a.id
			${whereClause}
			GROUP BY b.id
			ORDER BY b.id ${order}
			LIMIT ${take} OFFSET ${skip}
		`

		const countSql = `
			SELECT COUNT(DISTINCT b.id) as total
			FROM business b
			LEFT JOIN accompaniment a ON a.business_id = b.id
			${whereClause}
		`

		const [items, countResult] = await Promise.all([
			this.dataSource.query(sql, params),
			this.dataSource.query(countSql, params)
		])

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findAllByBusiness(id: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		const queryBuilder = this.accompanimentRepository.createQueryBuilder('accompaniment')
			.select([
				'accompaniment.id AS id',
				'accompaniment.businessId AS businessId',
				'CONCAT(expert.firstName, " ", expert.lastName) AS expertName',
				'accompaniment.totalHours AS totalHours',
				'accompaniment.maxHoursPerSession AS maxHoursPerSession'
			])
			.innerJoin('accompaniment.expert', 'expert')
			.where('accompaniment.businessId = :id', { id })
			.orderBy('accompaniment.id', pageOptionsDto.order)
			.skip(pageOptionsDto.skip)
			.take(pageOptionsDto.take)

		const [items, totalCount] = await Promise.all([
			queryBuilder.getRawMany(),
			queryBuilder.getCount()
		])

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findOne(id: number) {
		if(!id) return {}

		const accompaniment = await this.accompanimentRepository.findOne({ where: { id } })

		return accompaniment || {}
	}

	async update(id: number, updateAccompanimentDto: UpdateAccompanimentDto) {
		if(!id) return { affected: 0 }

		const {
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		} = updateAccompanimentDto

		if(businessId) {
			const business = await this.businessRepository.findOne({ where: { id: businessId } })
			if (!business) {
				throw new BadRequestException(`Business with id ${businessId} not found`)
			}
		}

		if(expertId) {
			const expert = await this.expertRepository.findOne({ where: { id: expertId } })
			if (!expert) {
				throw new BadRequestException(`Expert with id ${expertId} not found`)
			}
		}

		if(strengtheningAreaId) {
			const strengtheningArea = await this.strengtheningAreaRepository.findOne({ where: { id: strengtheningAreaId } })
			if (!strengtheningArea) {
				throw new BadRequestException(`Strengthening area with id ${strengtheningAreaId} not found`)
			}
		}

		if(businessId && expertId) {
			const existingAccompaniment = await this.accompanimentRepository.findOne({
				where: { businessId, expertId }
			})
			if (existingAccompaniment && existingAccompaniment.id !== id) {
				throw new BadRequestException(`Business with id ${businessId} is already accompanied by expert with id ${expertId}`)
			}
		}

		return this.accompanimentRepository.update(id, {
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreaId
		})
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		return this.accompanimentRepository.delete(id)
	}
}
