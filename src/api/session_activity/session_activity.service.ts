import { DataSource, Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'

import { Session } from 'src/entities/Session'
import { SessionActivity } from 'src/entities/SessionActivity'
import { SessionActivityResponse } from 'src/entities/SessionActivityResponse'

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
		@InjectRepository(SessionActivity)
		private readonly sessionActivityRepository: Repository<SessionActivity>,

		@InjectRepository(SessionActivityResponse)
		private readonly sessionActivityResponseRepository: Repository<SessionActivityResponse>,

		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,

		private readonly dataSource: DataSource,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService,
		private readonly dateService: DateService
	) {}

	async create(user: JwtUser, createSessionActivityDto: CreateSessionActivityDto, file?: Express.Multer.File) {
		const { title, description, dueDatetime, requiresDeliverable, sessionId } = createSessionActivityDto
		const { id } = user

		const fullPath = file ? this.fileUploadService.getFullPath('session-activity', file.filename) : undefined

		const session = await this.sessionRepository.findOne({
			where: { id: sessionId },
			relations: ['accompaniment', 'accompaniment.business.user', 'accompaniment.expert.user']
		})
		if (!session) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException(`Sesión con id ${sessionId} no encontrada`)
		}

		try {
			const sessionActivity = this.sessionActivityRepository.create({
				sessionId,
				createdByUserId: id,
				title,
				description,
				requiresDeliverable,
				dueDatetime,
				attachmentPath: fullPath
			})

			const savedSessionActivity = await this.sessionActivityRepository.save(sessionActivity)

			try {
				const sessionDateTime = this.dateService.formatDate(new Date(session.startDatetime))

				const { email: businessEmail, name: businessName } = session.accompaniment?.business?.user || { email: '', name: '' }
				const expertName = session.accompaniment?.expert?.user?.name || ''

				this.mailService.sendNewSessionActivityEmail({
					to: businessEmail,
					businessName,
					expertName,
					sessionDateTime
				}, file)
			} catch (e) {
				console.error('Error sending new session activity email:', e)
			}

			return savedSessionActivity
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}

	async findAll(sessionId: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionActivity>> {
		const { take, skip, order } = pageOptionsDto

		const sql = `
			SELECT
				a.id AS id,
				a.session_id AS sessionId,
				a.created_by_user_id AS createdByUserId,
				a.title AS title,
				a.description AS description,
				a.requires_deliverable AS requiresDeliverable,
				DATE_FORMAT(a.due_datetime, '%Y-%m-%d %H:%i:%s') AS dueDatetime,
				CONCAT(?, '/', a.attachment_path) AS fileUrl,
				DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
				CONCAT('[', GROUP_CONCAT(JSON_OBJECT(
					'id', r.id,
					'sessionActivityId', r.session_activity_id,
					'respondedByUserId', r.responded_by_user_id,
					'deliverableFilePath', CONCAT(?, '/', r.deliverable_file_path),
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
			this.dataSource.query(sql, [envVars.APP_URL, envVars.APP_URL, sessionId]),
			this.dataSource.query(countSql, [sessionId])
		])

		const items = rawItems.map(item => {
			const responses = item.responses ? JSON.parse(item.responses) : []
			return { ...item, responses }
		})

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async respond(user: JwtUser, id: number, respondSessionActivityDto: RespondSessionActivityDto, file?: Express.Multer.File) {
		const fullPath = file ? this.fileUploadService.getFullPath('session-activity', file.filename) : undefined
		if(!id) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			return { affected: 0 }
		}

		const { deliverableDescription } = respondSessionActivityDto
		const { id: userId } = user

		const sessionActivity = await this.sessionActivityRepository.findOne({ where: { id } })
		if (!sessionActivity) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException(`Actividad de sesión con id ${id} no encontrada`)
		}

		const existingResponse = await this.sessionActivityResponseRepository.findOne({ where: { sessionActivityId: id } })
		if (existingResponse) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException(`La actividad de sesión con id ${id} ya fue respondida`)
		}

		try {
			const sessionActivityResponse = this.sessionActivityResponseRepository.create({
				sessionActivityId: id,
				respondedByUserId: userId,
				deliverableDescription,
				deliverableFilePath: fullPath
			})

			return this.sessionActivityResponseRepository.save(sessionActivityResponse)
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}

	async rate(id: number, rateSessionActivityDto: RateSessionActivityDto) {
		if(!id) return { affected: 0 }

		const { grade } = rateSessionActivityDto

		const sessionActivity = await this.sessionActivityRepository.findOne({ where: { id } })
		if (!sessionActivity) {
			throw new BadRequestException(`Actividad de sesión con id ${id} no encontrada`)
		}

		const sessionActivityResponse = await this.sessionActivityResponseRepository.findOne({ where: { sessionActivityId: id } })
		if (!sessionActivityResponse) {
			throw new BadRequestException(`La respuesta de la actividad de sesión con id ${id} no fue encontrada`)
		}

		if (sessionActivityResponse.grade) {
			throw new BadRequestException(`La actividad de sesión con id ${id} ya fue calificada`)
		}

		return this.sessionActivityResponseRepository.update(sessionActivityResponse.id, {
			grade,
			gradedDatetime: new Date()
		})
	}
}
