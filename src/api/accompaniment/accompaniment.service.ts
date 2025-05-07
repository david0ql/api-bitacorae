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
			throw new BadRequestException(`No se encontró una empresa con el ID ${businessId}`)
		}

		const expert = await this.expertRepository.findOne({ where: { id: expertId } })
		if (!expert) {
			throw new BadRequestException(`No se encontró un experto con el ID ${expertId}`)
		}

		const strengtheningArea = await this.strengtheningAreaRepository.findOne({ where: { id: strengtheningAreaId } })
		if (!strengtheningArea) {
			throw new BadRequestException(`No se encontró un área de fortalecimiento con el ID ${strengtheningAreaId}`)
		}

		if(totalHours < maxHoursPerSession) {
			throw new BadRequestException(`El total de horas (${totalHours}) no puede ser menor a las horas máximas por sesión (${maxHoursPerSession})`)
		}

		const usedHoursResult = await this.accompanimentRepository
			.createQueryBuilder("accompaniment")
			.select("SUM(accompaniment.totalHours)", "usedHours")
			.where("accompaniment.businessId = :businessId", { businessId })
			.getRawOne()

		const usedHours = Number(usedHoursResult.usedHours || 0)
		const remainingHours = business.assignedHours - usedHours

		if (totalHours > remainingHours) {
			throw new BadRequestException(
				`El total de horas (${totalHours}) excede las horas disponibles (${remainingHours}) para la empresa`
			)
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

		if (roleId === 3) {
			const expert = await this.expertRepository.findOne({ where: { userId: id }, select: ['id'] })
			if (!expert) throw new BadRequestException(`No se encontró un experto con el ID de usuario ${id}`)
			whereConditions.push(`a.expert_id = ?`)
			params.push(expert.id)
		}

		if (roleId === 4) {
			const business = await this.businessRepository.findOne({ where: { userId: id }, select: ['id'] })
			if (!business) throw new BadRequestException(`No se encontró una empresa con el ID de usuario ${id}`)
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
			SELECT COUNT(DISTINCT b.id) AS total
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

	async findAllByBusiness(user: JwtUser, id: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		const { id: userId, roleId } = user
		const { take, skip, order } = pageOptionsDto

		let whereConditions: string[] = ['a.business_id = ?']
		let params: any[] = [id]

		if (roleId === 3) {
			const expert = await this.expertRepository.findOne({ where: { userId }, select: ['id'] })
			if (!expert) throw new BadRequestException(`No se encontró un experto con el ID de usuario ${id}`)

			whereConditions.push(`AND a.expert_id = ?`)
			params.push(expert.id)
		}

		const whereClause = whereConditions.join(' ')

		const sql = `
			SELECT
				a.id AS id,
				a.total_hours AS totalHours,
				a.max_hours_per_session AS maxHoursPerSession,
				CONCAT(e.first_name, ' ', e.last_name) AS expertName,
				e.id AS expertId,
				b.id AS businessId,
				b.assigned_hours AS assignedHours,
				IFNULL(ROUND(SUM(CASE WHEN s.status_id = 3 THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)), 0) AS completedHours
			FROM
				accompaniment a
				INNER JOIN expert e ON e.id = a.expert_id
				INNER JOIN business b ON b.id = a.business_id
				LEFT JOIN session s ON s.accompaniment_id = a.id
			WHERE
				${whereClause}
			GROUP BY a.id
			ORDER BY a.id ${order}
			LIMIT ${take} OFFSET ${skip}
		`

		const countSql = `
			SELECT COUNT(DISTINCT a.id) AS total
			FROM accompaniment a
			INNER JOIN expert e ON e.id = a.expert_id
			INNER JOIN business b ON b.id = a.business_id
			WHERE ${whereClause}
		`

		const [items, countResult] = await Promise.all([
			this.dataSource.query(sql, params),
			this.dataSource.query(countSql, params)
		])

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findAllByExpert(id: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		const { take, skip, order } = pageOptionsDto

		const expert = await this.expertRepository.findOne({ where: { id }, select: ['id'] })
		if (!expert) throw new BadRequestException(`No se encontró un experto con el ID ${id}`)

		const sql = `
			SELECT
				a.id AS id,
				a.total_hours AS totalHours,
				a.max_hours_per_session AS maxHoursPerSession,
				CONCAT(e.first_name, ' ', e.last_name) AS expertName,
				e.id AS expertId,
				b.id AS businessId,
				b.assigned_hours AS assignedHours,
				IFNULL(ROUND(SUM(CASE WHEN s.status_id = 3 THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)), 0) AS completedHours
			FROM
				accompaniment a
				INNER JOIN expert e ON e.id = a.expert_id
				INNER JOIN business b ON b.id = a.business_id
				INNER JOIN session s ON s.accompaniment_id = a.id
			WHERE
				a.expert_id = ?
			GROUP BY a.id
			ORDER BY a.id ${order}
			LIMIT ${take} OFFSET ${skip}
		`

		const countSql = `
			SELECT COUNT(DISTINCT a.id) AS total
			FROM accompaniment a
			INNER JOIN expert e ON e.id = a.expert_id
			INNER JOIN business b ON b.id = a.business_id
			WHERE a.expert_id = ?
		`

		const [items, countResult] = await Promise.all([
			this.dataSource.query(sql, [id]),
			this.dataSource.query(countSql, [id])
		])

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findOne(id: number) {
		if(!id) return {}

		const accompaniment = await this.accompanimentRepository.findOne({
			select: {
				id: true,
				businessId: true,
				expertId: true,
				totalHours: true,
				maxHoursPerSession: true,
				strengtheningAreaId: true
			},
			where: { id }
		})

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
				throw new BadRequestException(`No se encontró una empresa con el ID ${businessId}`)
			}
		}

		if(expertId) {
			const expert = await this.expertRepository.findOne({ where: { id: expertId } })
			if (!expert) {
				throw new BadRequestException(`No se encontró un experto con el ID ${expertId}`)
			}
		}

		if(strengtheningAreaId) {
			const strengtheningArea = await this.strengtheningAreaRepository.findOne({ where: { id: strengtheningAreaId } })
			if (!strengtheningArea) {
				throw new BadRequestException(`No se encontró un área de fortalecimiento con el ID ${strengtheningAreaId}`)
			}
		}

		if(businessId && expertId) {
			const existingAccompaniment = await this.accompanimentRepository.findOne({
				where: { businessId, expertId }
			})
			if (existingAccompaniment && existingAccompaniment.id !== id) {
				throw new BadRequestException(`La empresa con el ID ${businessId} ya está siendo acompañada por el experto con el ID ${expertId}`)
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

		try {
			return this.accompanimentRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar el acompañamiento`)
		}
	}
}
