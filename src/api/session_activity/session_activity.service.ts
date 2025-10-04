import { BadRequestException, Injectable } from '@nestjs/common'

import { Session } from 'src/entities/Session'
import { SessionActivity } from 'src/entities/SessionActivity'
import { SessionActivityResponse } from 'src/entities/SessionActivityResponse'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionActivityDto } from './dto/create-session_activity.dto'
import { RespondSessionActivityDto } from './dto/respond-session_activity.dto'
import { RateSessionActivityDto } from './dto/rate-session_activity.dto'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { DateService } from 'src/services/date/date.service'

import envVars from 'src/config/env'

@Injectable()
export class SessionActivityService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService,
		private readonly dateService: DateService
	) {}

	async create(user: JwtUser, createSessionActivityDto: CreateSessionActivityDto, businessName: string, file?: Express.Multer.File) {
		console.log('🚀 [SESSION ACTIVITY CREATE] Iniciando creación de actividad de sesión')
		console.log('📝 [SESSION ACTIVITY CREATE] DTO recibido:', JSON.stringify(createSessionActivityDto, null, 2))
		console.log('🏢 [SESSION ACTIVITY CREATE] Business name (dbName):', businessName)
		console.log('📎 [SESSION ACTIVITY CREATE] File:', file?.filename || 'ninguno')
		if (!businessName) throw new BadRequestException('businessName es requerido')
		
		const { title, description, dueDatetime, requiresDeliverable, sessionId } = createSessionActivityDto
		const { id } = user
		const now = this.dateService.getNow()

		const fullPath = file ? this.fileUploadService.getFullPath('session-activity', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const sessionActivityRepository = businessDataSource.getRepository(SessionActivity)

			const session = await sessionRepository.findOne({
				where: { id: sessionId },
				relations: ['accompaniment', 'accompaniment.business.user', 'accompaniment.expert.user']
			})
			if (!session) {
				if (fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException(`Sesión con id ${sessionId} no encontrada`)
			}

			if(dueDatetime) {
				const date = this.dateService.parseToDate(dueDatetime)
				if (date < now) {
					if (fullPath) {
						this.fileUploadService.deleteFile(fullPath)
					}
					throw new BadRequestException('La fecha de entrega no puede ser anterior a la fecha actual')
				}
			}

			const sessionActivity = sessionActivityRepository.create({
				sessionId,
				createdByUserId: id,
				title,
				description,
				requiresDeliverable,
				dueDatetime,
				attachmentPath: fullPath
			})

			const savedSessionActivity = await sessionActivityRepository.save(sessionActivity)

			try {
				const sessionDateTime = this.dateService.formatDate(new Date(session.startDatetime))

				const { email: businessEmail, name: businessDisplayName } = session.accompaniment?.business?.user || { email: '', name: '' }
				const { email: expertEmail, name: expertName } = session.accompaniment?.expert?.user || { email: '', name: '' }

				this.mailService.sendNewSessionActivityEmail({
					sessionId: session.id,
					to: businessEmail,
					businessName: businessDisplayName,
					expertName,
					expertEmail,
					sessionDateTime
				}, businessName, file)
			} catch (e) {
				console.error('Error sending new session activity email:', e)
			}

			return savedSessionActivity
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAll(sessionId: number, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<SessionActivity>> {
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					a.id AS id,
					a.session_id AS sessionId,
					a.created_by_user_id AS createdByUserId,
					a.title AS title,
					a.description AS description,
					a.requires_deliverable AS requiresDeliverable,
					DATE_FORMAT(a.due_datetime, '%Y-%m-%d %H:%i:%s') AS dueDatetime,
					CASE 
						WHEN a.attachment_path IS NULL OR a.attachment_path = '' THEN NULL
						WHEN a.attachment_path LIKE 'http%' THEN a.attachment_path
						ELSE CONCAT(?, '/', a.attachment_path)
					END AS fileUrl,
					DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
					CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
						'id', r.id,
						'sessionActivityId', r.session_activity_id,
						'respondedByUserId', r.responded_by_user_id,
						'deliverableDescription', r.deliverable_description,
						'deliverableFilePath', CASE 
							WHEN r.deliverable_file_path IS NULL OR r.deliverable_file_path = '' THEN NULL
							WHEN r.deliverable_file_path LIKE 'http%' THEN r.deliverable_file_path
							ELSE CONCAT(?, '/', r.deliverable_file_path)
						END,
						'respondedDatetime', DATE_FORMAT(r.responded_datetime, '%Y-%m-%d %H:%i:%s'),
						'grade', r.grade,
						'gradedDatetime', DATE_FORMAT(r.graded_datetime, '%Y-%m-%d %H:%i:%s')
					)),
					']') AS responses
				FROM
					session_activity a
					LEFT JOIN session_activity_response r ON a.id = r.session_activity_id
				WHERE a.session_id = ?
				GROUP BY a.id
				ORDER BY a.created_at ${order}
				LIMIT ${take} OFFSET ${skip}
			`

			const countSql = `SELECT COUNT(DISTINCT a.id) AS total FROM session_activity a WHERE a.session_id = ?`

			const [rawItems, countResult] = await Promise.all([
				businessDataSource.query(sql, [envVars.APP_URL, envVars.APP_URL, envVars.APP_URL, sessionId]),
				businessDataSource.query(countSql, [sessionId])
			])

			const items = rawItems.map(item => {
				const responses = item.responses ? JSON.parse(item.responses) : []
				return { ...item, responses }
			})

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async respond(user: JwtUser, id: number, respondSessionActivityDto: RespondSessionActivityDto, businessName: string, file?: Express.Multer.File) {
		if (!businessName) throw new BadRequestException('businessName es requerido')
		
		const fullPath = file ? this.fileUploadService.getFullPath('session-activity', file.filename) : undefined
		if(!id) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		const { deliverableDescription } = respondSessionActivityDto
		const { id: userId } = user

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionActivityRepository = businessDataSource.getRepository(SessionActivity)
			const sessionActivityResponseRepository = businessDataSource.getRepository(SessionActivityResponse)
			const sessionRepository = businessDataSource.getRepository(Session)

			const sessionActivity = await sessionActivityRepository.findOne({ where: { id } })
			if (!sessionActivity) {
				if (fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException(`Actividad de sesión con id ${id} no encontrada`)
			}

			const existingResponse = await sessionActivityResponseRepository.findOne({ where: { sessionActivityId: id } })
			if (existingResponse) {
				if (fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException(`La actividad de sesión con id ${id} ya fue respondida`)
			}

			const sessionActivityResponse = sessionActivityResponseRepository.create({
				sessionActivityId: id,
				respondedByUserId: userId,
				deliverableDescription,
				deliverableFilePath: fullPath
			})

			const savedResponse = await sessionActivityResponseRepository.save(sessionActivityResponse)

			try {
				const session = await sessionRepository.findOne({
					where: { id: sessionActivity.sessionId },
					relations: ['accompaniment', 'accompaniment.business.user', 'accompaniment.expert.user']
				})

				if (session) {
					const sessionDateTime = this.dateService.formatDate(new Date(session.startDatetime))
					const { email: businessEmail, name: businessDisplayName } = session.accompaniment?.business?.user || { email: '', name: '' }
					const { email: expertEmail, name: expertName } = session.accompaniment?.expert?.user || { email: '', name: '' }

					this.mailService.sendRespondedSessionEmail({
						businessId: session.accompaniment?.business?.id,
						accompanimentId: session.accompaniment?.id,
						sessionId: session.id,
						to: businessEmail,
						businessName: businessDisplayName,
						expertName,
						businessEmail,
						sessionDateTime
					}, businessName, file)
				}
			} catch (e) {
				console.error('Error sending session activity response email:', e)
			}

			return savedResponse
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async rate(id: number, rateSessionActivityDto: RateSessionActivityDto, businessName: string) {
		const { grade } = rateSessionActivityDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionActivityResponseRepository = businessDataSource.getRepository(SessionActivityResponse)
			return await sessionActivityResponseRepository.update(id, { 
				grade, 
				gradedDatetime: this.dateService.getNow() 
			})
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
