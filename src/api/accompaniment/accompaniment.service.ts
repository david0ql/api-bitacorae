import { DataSource, In, Repository } from 'typeorm'
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

import envVars from 'src/config/env'

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
			strengtheningAreas
		} = createAccompanimentDto

		const business = await this.businessRepository.findOne({ where: { id: businessId } })
		if (!business) {
			throw new BadRequestException(`No se encontró una empresa con el ID ${businessId}`)
		}

		const expert = await this.expertRepository.findOne({ where: { id: expertId } })
		if (!expert) {
			throw new BadRequestException(`No se encontró un experto con el ID ${expertId}`)
		}

		const existingAccompaniment = await this.accompanimentRepository.findOne({
			where: { businessId, expertId }
		})
		if (existingAccompaniment) {
			throw new BadRequestException(`La empresa con el ID ${businessId} ya está siendo acompañada por el experto con el ID ${expertId}`)
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

		const strengtheningAreaEntities = await this.strengtheningAreaRepository.findBy({
			id: In(strengtheningAreas)
		})

		const accompaniment = this.accompanimentRepository.create({
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreas: strengtheningAreaEntities
		})

		return this.accompanimentRepository.save(accompaniment)
	}

	async findAll(user: JwtUser, pageOptionsDto: PageOptionsDto): Promise<PageDto<Accompaniment>> {
		const { id, roleId } = user
		const { take, skip, order } = pageOptionsDto

		let sql = `
			SELECT
				b.id AS id,
				b.social_reason AS socialReason,
				CONCAT(c.first_name, ' ', c.last_name) AS name,
				CONCAT("${envVars.APP_URL}", "/", c.photo) AS photo,
				bs.name AS size,
				IF(COUNT(DISTINCT sa.id) > 0,
					CONCAT('[', GROUP_CONCAT(DISTINCT JSON_OBJECT(
						'value', sa.id,
						'label', sa.name
					)), ']'),
					NULL
				) AS strengtheningAreas,
				b.assigned_hours AS assignedHours,
				IFNULL(stats.scheduledSessions, 0) AS scheduledSessions,
				IFNULL(stats.completedHours, 0) AS completedHours
			FROM
				business b
				INNER JOIN business_size bs ON bs.id = b.business_size_id
				LEFT JOIN contact_information c ON c.business_id = b.id
				LEFT JOIN accompaniment a ON a.business_id = b.id
				LEFT JOIN accompaniment_strengthening_area_rel asar ON asar.accompaniment_id = a.id
				LEFT JOIN strengthening_area sa ON sa.id = asar.strengthening_area_id
				LEFT JOIN (
					SELECT
						a.business_id,
						COUNT(DISTINCT s.id) AS scheduledSessions,
						ROUND(SUM(CASE WHEN s.status_id = 3 THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)) AS completedHours
					FROM accompaniment a
					INNER JOIN session s ON s.accompaniment_id = a.id
					GROUP BY a.business_id
				) stats ON stats.business_id = b.id
			GROUP BY b.id
			ORDER BY b.id ${order}
			LIMIT ${take} OFFSET ${skip}
		`

		let countSql = `
			SELECT COUNT(DISTINCT b.id) AS total
			FROM business b
			LEFT JOIN accompaniment a ON a.business_id = b.id
		`

		if (roleId === 3) {
			const expert = await this.expertRepository.findOne({ where: { userId: id }, select: ['id'] })
			if (!expert) throw new BadRequestException(`No se encontró un experto con el ID de usuario ${id}`)

			sql = `
				WITH expert_accompaniment AS (
					SELECT
						a.business_id,
						a.id AS accompaniment_id,
						a.expert_id
					FROM accompaniment a
					WHERE a.expert_id = ${expert.id}
				),
				session_stats AS (
					SELECT
						a.id AS accompaniment_id,
						COUNT(DISTINCT s.id) AS scheduledSessions,
						ROUND(SUM(CASE WHEN s.status_id = 3 THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)) AS completedHours
					FROM accompaniment a
					INNER JOIN session s ON s.accompaniment_id = a.id
					WHERE a.expert_id = ${expert.id}
					GROUP BY a.id
				)

				SELECT
					b.id AS id,
					ea.expert_id AS expertId,
					ea.accompaniment_id AS accompanimentId,
					b.social_reason AS socialReason,
					CONCAT(c.first_name, ' ', c.last_name) AS name,
					CONCAT("${envVars.APP_URL}", "/", c.photo) AS photo,
					bs.name AS size,
					IF(COUNT(DISTINCT sa.id) > 0,
						CONCAT('[', GROUP_CONCAT(DISTINCT JSON_OBJECT(
							'value', sa.id,
							'label', sa.name
						)), ']'),
						NULL
					) AS strengtheningAreas,
					b.assigned_hours AS assignedHours,
					IFNULL(ss.scheduledSessions, 0) AS scheduledSessions,
					IFNULL(ss.completedHours, 0) AS completedHours
				FROM
					business b
					INNER JOIN business_size bs ON bs.id = b.business_size_id
					LEFT JOIN contact_information c ON c.business_id = b.id
					INNER JOIN expert_accompaniment ea ON ea.business_id = b.id
					LEFT JOIN accompaniment_strengthening_area_rel asar ON asar.accompaniment_id = ea.accompaniment_id
					LEFT JOIN strengthening_area sa ON sa.id = asar.strengthening_area_id
					LEFT JOIN session_stats ss ON ss.accompaniment_id = ea.accompaniment_id
				GROUP BY b.id
				ORDER BY b.id ${order}
				LIMIT ${take} OFFSET ${skip}
			`

			countSql = `
				WITH expert_accompaniment AS (
					SELECT
						a.business_id
					FROM accompaniment a
					WHERE a.expert_id = ${expert.id}
				)

				SELECT COUNT(DISTINCT b.id) AS total
				FROM business b
				INNER JOIN expert_accompaniment ea ON ea.business_id = b.id
			`
		}

		const [rawItems, countResult] = await Promise.all([
			this.dataSource.query(sql),
			this.dataSource.query(countSql)
		])

		const items = rawItems.map(item => {
			const strengtheningAreas = item.strengtheningAreas ? JSON.parse(item.strengtheningAreas) : []

			return {
				...item,
				strengtheningAreas
			}
		})

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
				IFNULL(COUNT(DISTINCT s.id), 0) AS scheduledSessions,
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
				IFNULL(COUNT(DISTINCT s.id), 0) AS scheduledSessions,
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

	async findAllByBusinessForExpert(bussinesId: number, user: JwtUser,) {
		if(!bussinesId) return {}
		const { id: userId } = user

		const expert = await this.expertRepository.findOne({ where: { userId }, select: ['id'] })
		if (!expert) throw new BadRequestException(`No se encontró un experto con el ID de usuario ${userId}`)

		const accompaniment = await this.accompanimentRepository.findOne({
			select: {
				id: true,
				businessId: true,
				expertId: true,
				totalHours: true,
				maxHoursPerSession: true,
				strengtheningAreas: {
					id: true,
					name: true
				}
			},
			where: { businessId: bussinesId, expertId: expert.id },
			relations: ['strengtheningAreas']
		})

		if (!accompaniment) return {}

		return {
			...accompaniment,
			strengtheningAreas: accompaniment.strengtheningAreas.map(area => ({
				value: area.id,
				label: area.name
			}))
		}
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
				strengtheningAreas: {
					id: true,
					name: true
				}
			},
			where: { id },
			relations: ['strengtheningAreas']
		})

		if (!accompaniment) return {}

		return {
			...accompaniment,
			strengtheningAreas: accompaniment.strengtheningAreas.map(area => ({
				value: area.id,
				label: area.name
			}))
		}
	}

	async update(id: number, updateAccompanimentDto: UpdateAccompanimentDto) {
		if(!id) return { affected: 0 }

		const {
			businessId,
			expertId,
			totalHours,
			maxHoursPerSession,
			strengtheningAreas
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

		if(businessId && expertId) {
			const existingAccompaniment = await this.accompanimentRepository.findOne({
				where: { businessId, expertId }
			})
			if (existingAccompaniment && existingAccompaniment.id !== id) {
				throw new BadRequestException(`La empresa con el ID ${businessId} ya está siendo acompañada por el experto con el ID ${expertId}`)
			}
		}

		if(totalHours && maxHoursPerSession && totalHours < maxHoursPerSession) {
			throw new BadRequestException(`El total de horas (${totalHours}) no puede ser menor a las horas máximas por sesión (${maxHoursPerSession})`)
		}

		const sessionHours = await this.dataSource.query(`
			SELECT ROUND(SUM(TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime)), 0) AS totalHours
			FROM session s
			WHERE s.accompaniment_id = ?
		`, [id])

		const totalSessionHours = Number(sessionHours[0]?.totalHours || 0)

		if (totalHours && totalSessionHours > totalHours) {
			throw new BadRequestException(
				`El total de horas del acompañamiento (${totalHours}) no puede ser menor a las horas totales de las sesiones programadas (${totalSessionHours})`
			)
		}

		const usedHoursResult = await this.accompanimentRepository
			.createQueryBuilder("accompaniment")
			.select("SUM(accompaniment.totalHours)", "usedHours")
			.where("accompaniment.businessId = :businessId", { businessId })
			.andWhere("accompaniment.id != :id", { id })
			.getRawOne()

		const usedHours = Number(usedHoursResult.usedHours || 0)
		const business = await this.businessRepository.findOne({ where: { id: businessId } })
		const remainingHours = business ? business.assignedHours - usedHours : 0

		if (totalHours && totalHours > remainingHours) {
			throw new BadRequestException(
				`El total de horas (${totalHours}) excede las horas disponibles (${remainingHours}) para la empresa`
			)
		}

		const existingAccompaniment = await this.accompanimentRepository.findOne({
			where: { id },
			relations: ['strengtheningAreas']
		})

		if (!existingAccompaniment) {
			throw new BadRequestException(`No se encontró un acompañamiento con el ID ${id}`)
		}

		const strengtheningAreaEntities = await this.strengtheningAreaRepository.findBy({
			id: In(strengtheningAreas || [])
		})

		existingAccompaniment.businessId = businessId ?? existingAccompaniment.businessId
		existingAccompaniment.expertId = expertId ?? existingAccompaniment.expertId
		existingAccompaniment.totalHours = totalHours ?? existingAccompaniment.totalHours
		existingAccompaniment.maxHoursPerSession = maxHoursPerSession ?? existingAccompaniment.maxHoursPerSession
		existingAccompaniment.strengtheningAreas = strengtheningAreaEntities

		await this.accompanimentRepository.save(existingAccompaniment)

		return { affected: 1 }
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
