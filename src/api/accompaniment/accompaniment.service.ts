import { In } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'

import { Accompaniment } from 'src/entities/Accompaniment'
import { Business } from 'src/entities/Business'
import { Expert } from 'src/entities/Expert'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

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
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async create(createAccompanimentDto: CreateAccompanimentDto, businessName: string) {
		console.log('🏁 AccompanimentService.create called with businessName:', businessName)
		console.log('📋 CreateAccompanimentDto:', createAccompanimentDto)
		
		const { businessId, expertId, totalHours, maxHoursPerSession, strengtheningAreas } = createAccompanimentDto
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			console.error('❌ Failed to get business connection for:', businessName)
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}
		
		console.log('✅ Business connection established successfully')
		
		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const expertRepository = businessDataSource.getRepository(Expert)
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const business = await businessRepository.findOne({ where: { id: businessId } })
			if (!business) throw new BadRequestException(`No se encontró una empresa con el ID ${businessId}`)

			const expert = await expertRepository.findOne({ where: { id: expertId } })
			if (!expert) throw new BadRequestException(`No se encontró un experto con el ID ${expertId}`)

			const existingAccompaniment = await accompanimentRepository.findOne({ where: { businessId, expertId } })
			if (existingAccompaniment) throw new BadRequestException(`La empresa con el ID ${businessId} ya está siendo acompañada por el experto con el ID ${expertId}`)

			if(totalHours < maxHoursPerSession) throw new BadRequestException(`El total de horas (${totalHours}) no puede ser menor a las horas máximas por sesión (${maxHoursPerSession})`)

			const usedHoursResult = await accompanimentRepository
				.createQueryBuilder("accompaniment")
				.select("SUM(accompaniment.totalHours)", "usedHours")
				.where("accompaniment.businessId = :businessId", { businessId })
				.getRawOne()

			const usedHours = Number(usedHoursResult.usedHours || 0)
			const remainingHours = business.assignedHours - usedHours

			if (totalHours > remainingHours) throw new BadRequestException(`El total de horas (${totalHours}) excede las horas disponibles (${remainingHours}) para la empresa`)

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({ id: In(strengtheningAreas) })

			const accompaniment = accompanimentRepository.create({
				businessId,
				expertId,
				totalHours,
				maxHoursPerSession,
				strengtheningAreas: strengtheningAreaEntities
			})

			console.log('💾 Saving accompaniment...')
			const result = await accompanimentRepository.save(accompaniment)
			console.log('✅ Accompaniment saved successfully:', result.id)
			return result
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAll(user: JwtUser, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Accompaniment>> {
		const { id, roleId } = user
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const expertRepository = businessDataSource.getRepository(Expert)

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
				const expert = await expertRepository.findOne({ where: { userId: id }, select: ['id'] })
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
				businessDataSource.query(sql),
				businessDataSource.query(countSql)
			])

			const items = rawItems.map(item => {
				const strengtheningAreas = item.strengtheningAreas ? JSON.parse(item.strengtheningAreas) : []
				return { ...item, strengtheningAreas }
			})

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllByBusiness(user: JwtUser, id: number, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Accompaniment>> {
		const { id: userId, roleId } = user
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const expertRepository = businessDataSource.getRepository(Expert)

			let whereConditions: string[] = ['a.business_id = ?']
			let params: any[] = [id]

			if (roleId === 3) {
				const expert = await expertRepository.findOne({ where: { userId }, select: ['id'] })
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
				businessDataSource.query(sql, params),
				businessDataSource.query(countSql, params)
			])

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllByExpert(id: number, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Accompaniment>> {
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const expertRepository = businessDataSource.getRepository(Expert)

			const expert = await expertRepository.findOne({ where: { id }, select: ['id'] })
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
				businessDataSource.query(sql, [id]),
				businessDataSource.query(countSql, [id])
			])

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllByBusinessForExpert(bussinesId: number, user: JwtUser, businessName: string) {
		const { id: userId } = user

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)

			const expert = await expertRepository.findOne({ where: { userId }, select: ['id'] })
			if (!expert) throw new BadRequestException(`No se encontró un experto con el ID de usuario ${userId}`)

			const accompaniment = await accompanimentRepository.findOne({
				select: {
					id: true,
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

			if (!accompaniment) throw new BadRequestException(`No se encontró un acompañamiento para la empresa ${bussinesId} y el experto ${expert.id}`)

			return accompaniment
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findOne(id: number, businessName: string) {
		if(!id) return {}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)

			const accompaniment = await accompanimentRepository.findOne({
				select: {
					id: true,
					totalHours: true,
					maxHoursPerSession: true,
					business: {
						id: true,
						socialReason: true,
						assignedHours: true
					},
					expert: {
						id: true,
						firstName: true,
						lastName: true
					},
					strengtheningAreas: {
						id: true,
						name: true
					}
				},
				where: { id },
				relations: ['business', 'expert', 'strengtheningAreas']
			})

			if (!accompaniment) throw new BadRequestException(`No se encontró un acompañamiento con el ID ${id}`)

			return accompaniment
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async update(id: number, updateAccompanimentDto: UpdateAccompanimentDto, businessName: string) {
		if(!id) return { affected: 0 }

		const { businessId, expertId, totalHours, maxHoursPerSession, strengtheningAreas } = updateAccompanimentDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const expertRepository = businessDataSource.getRepository(Expert)
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			if(businessId) {
				const business = await businessRepository.findOne({ where: { id: businessId } })
				if (!business) throw new BadRequestException(`No se encontró una empresa con el ID ${businessId}`)
			}

			if(expertId) {
				const expert = await expertRepository.findOne({ where: { id: expertId } })
				if (!expert) throw new BadRequestException(`No se encontró un experto con el ID ${expertId}`)
			}

			if(businessId && expertId) {
				const existingAccompaniment = await accompanimentRepository.findOne({
					where: { businessId, expertId }
				})
				if (existingAccompaniment && existingAccompaniment.id !== id) {
					throw new BadRequestException(`La empresa con el ID ${businessId} ya está siendo acompañada por el experto con el ID ${expertId}`)
				}
			}

			if(totalHours && maxHoursPerSession && totalHours < maxHoursPerSession) {
				throw new BadRequestException(`El total de horas (${totalHours}) no puede ser menor a las horas máximas por sesión (${maxHoursPerSession})`)
			}

			if(totalHours && businessId) {
				const usedHoursResult = await accompanimentRepository
					.createQueryBuilder("accompaniment")
					.select("SUM(accompaniment.totalHours)", "usedHours")
					.where("accompaniment.businessId = :businessId", { businessId })
					.andWhere("accompaniment.id != :id", { id })
					.getRawOne()

				const usedHours = Number(usedHoursResult.usedHours || 0)
				const business = await businessRepository.findOne({ where: { id: businessId } })
				const remainingHours = business ? business.assignedHours - usedHours : 0

				if (totalHours > remainingHours) {
					throw new BadRequestException(`El total de horas (${totalHours}) excede las horas disponibles (${remainingHours}) para la empresa`)
				}
			}

			const existingAccompaniment = await accompanimentRepository.findOne({
				where: { id },
				relations: ['strengtheningAreas']
			})

			if (!existingAccompaniment) {
				throw new BadRequestException(`No se encontró un acompañamiento con el ID ${id}`)
			}

			if (businessId) existingAccompaniment.businessId = businessId
			if (expertId) existingAccompaniment.expertId = expertId
			if (totalHours) existingAccompaniment.totalHours = totalHours
			if (maxHoursPerSession) existingAccompaniment.maxHoursPerSession = maxHoursPerSession

			if(strengtheningAreas) {
				const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
					id: In(strengtheningAreas)
				})
				existingAccompaniment.strengtheningAreas = strengtheningAreaEntities
			}

			await accompanimentRepository.save(existingAccompaniment)
			return { affected: 1 }
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async remove(id: number, businessName: string) {
		if(!id) return { affected: 0 }

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)
			return await accompanimentRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar el acompañamiento`)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
