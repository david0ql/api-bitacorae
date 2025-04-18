import { DataSource, Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Session } from 'src/entities/Session'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'
import { Accompaniment } from 'src/entities/Accompaniment'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessiontDto } from './dto/create-session.dto'
import { UpdateSessionDto } from './dto/update-session.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'

import envVars from 'src/config/env'

@Injectable()
export class SessionService {
	constructor(
		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,

		@InjectRepository(Accompaniment)
		private readonly accompanimentRepository: Repository<Accompaniment>,

		@InjectRepository(SessionPreparationFile)
		private readonly sessionPreparationFileRepository: Repository<SessionPreparationFile>,

		private readonly dataSource: DataSource,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	async create(createSessiontDto: CreateSessiontDto, files?: Express.Multer.File[]) {
		const {
			accompanimentId,
			title,
			startDatetime,
			endDatetime,
			conferenceLink,
			preparationNotes
		} = createSessiontDto

		const preparationFiles = files?.length ? files.map(file => {
			return this.fileUploadService.getFullPath('session-preparation', file.filename)
		}) : []

		const accompaniment = await this.accompanimentRepository.findOne({
			where: { id: accompanimentId },
			relations: ['business', 'expert', 'business.user', 'expert.user']
		})
		if (!accompaniment) {
			preparationFiles.forEach(fullPath => {
				this.fileUploadService.deleteFile(fullPath)
			})

			throw new BadRequestException(`Accompaniment with id ${accompanimentId} not found`)
		}

		try {
			const session = this.sessionRepository.create({
				accompaniment,
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes
			})

			const savedSession = await this.sessionRepository.save(session)

			const sessionPreparationFiles = preparationFiles.map(fullPath => {
				return this.sessionPreparationFileRepository.create({
					sessionId: savedSession.id,
					filePath: fullPath
				})
			})

			await this.sessionPreparationFileRepository.save(sessionPreparationFiles)

			try {
				const date = new Date(startDatetime)
				const sessionDate = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: '2-digit' })
				const sessionTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })

				const { email: bussinesEmail, name: bussinesName } = accompaniment.business?.user || { email: '', name: '' }
				const expertName = accompaniment.expert?.user?.name || ''

				this.mailService.sendNewSessionEmail({
					to: bussinesEmail,
					bussinesName,
					expertName,
					sessionDate,
					sessionTime,
					preparationNotes
				}, files)
			} catch (error) {
				console.error('Error sending new session email:', error)
			}

			return savedSession
		} catch (error) {
			preparationFiles.forEach(fullPath => {
				this.fileUploadService.deleteFile(fullPath)
			})
			throw error
		}
	}

	async findAllByAccompaniment(accompanimentId: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<Session>> {
		const { take, skip, order } = pageOptionsDto

		const sql = `
			SELECT
				s.id AS id,
				s.title AS title,
				s.start_datetime AS startDatetime,
				s.end_datetime AS endDatetime,
				TIMESTAMPDIFF(MINUTE, s.start_datetime, s.end_datetime) AS duration,
				ss.name AS status,
				GROUP_CONCAT(CONCAT(?, "/", spf.file_path) SEPARATOR '||') AS preparationFiles
			FROM
				session s
				INNER JOIN session_status ss ON s.status_id = ss.id
				LEFT JOIN session_preparation_file spf ON spf.session_id = s.id
			WHERE s.accompaniment_id = ?
			GROUP BY s.id
			ORDER BY s.start_datetime ${order}
			LIMIT ${take} OFFSET ${skip}
		`

		const countSql = `
			SELECT COUNT(DISTINCT s.id) AS total
			FROM session s
			WHERE s.accompaniment_id = ?
		`

		const [rawItems, countResult] = await Promise.all([
			this.dataSource.query(sql, [envVars.APP_URL, accompanimentId]),
			this.dataSource.query(countSql, [accompanimentId])
		])

		const items = rawItems.map(item => {
			const preparationFiles = item.preparationFiles ? item.preparationFiles.split('||') : []

			return { ...item, preparationFiles }
		})

		const totalCount = Number(countResult[0]?.total) ?? 0
		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}

	async findOne(id: number) {
		if (!id) return {}

		const rawSession = await this.sessionRepository
			.createQueryBuilder('session')
			.select([
				'session.id AS id',
				'session.accompanimentId AS accompanimentId',
				'session.title AS title',
				'session.startDatetime AS startDatetime',
				'session.endDatetime AS endDatetime',
				'session.conferenceLink AS conferenceLink',
				'session.preparationNotes AS preparationNotes',
				'session.sessionNotes AS sessionNotes',
				'session.conclusionsCommitments AS conclusionsCommitments',
				'status.id AS statusId',
				`GROUP_CONCAT(CONCAT(:appUrl, "/", spf.file_path) SEPARATOR '||') AS preparationFiles`
			])
			.innerJoin('session.status', 'status')
			.leftJoin('session_preparation_file', 'spf', 'spf.session_id = session.id')
			.where('session.id = :id', { id })
			.groupBy('session.id')
			.setParameters({ appUrl: envVars.APP_URL })
			.getRawOne()

		if (!rawSession) return {}

		return {
			...rawSession,
			preparationFiles: rawSession.preparationFiles ? rawSession.preparationFiles.split('||') : []
		}
	}

	async update(id: number, updateSessionDto: UpdateSessionDto, files?: Express.Multer.File[]) {
		const preparationFiles = files?.length ? files.map(file => {
			return this.fileUploadService.getFullPath('session-preparation', file.filename)
		}) : []

		if(!id) {
			preparationFiles.forEach(fullPath => {
				this.fileUploadService.deleteFile(fullPath)
			})
			return { affected: 0 }
		}

		const session = await this.sessionRepository.findOne({ where: { id } })
		if (!session) {
			preparationFiles.forEach(fullPath => {
				this.fileUploadService.deleteFile(fullPath)
			})

			throw new BadRequestException(`Session with id ${id} not found`)
		}

		try {
			const {
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes,
				sessionNotes,
				conclusionsCommitments
			} = updateSessionDto

			const sessionPreparationFiles = preparationFiles.map(fullPath => {
				return this.sessionPreparationFileRepository.create({
					sessionId: id,
					filePath: fullPath
				})
			})

			await this.sessionPreparationFileRepository.save(sessionPreparationFiles)

			return this.sessionRepository.update(id, {
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes,
				sessionNotes,
				conclusionsCommitments
			})
		} catch (error) {
			preparationFiles.forEach(fullPath => {
				this.fileUploadService.deleteFile(fullPath)
			})
			throw error
		}
	}

	async public(id: number) {
		const session = await this.sessionRepository.findOne({
			where: { id },
			relations: ['accompaniment', 'accompaniment.business.user', 'accompaniment.expert.user']
		})
		if (!session) {
			throw new BadRequestException(`Session with id ${id} not found`)
		}

		if (session.statusId !== 1) {
			throw new BadRequestException('Session is not in created status')
		}

		const updatedSession = await this.sessionRepository.update(id, { statusId: 2 })
		if (!updatedSession) {
			throw new BadRequestException(`Failed to update session with id ${id}`)
		}

		try {
			const date = new Date(session.startDatetime)
			const sessionDate = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: '2-digit' })
			const sessionTime = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true })

			const { email: bussinesEmail, name: bussinesName } = session.accompaniment?.business?.user || { email: '', name: '' }
			const expertName = session.accompaniment?.expert?.user?.name || ''

			this.mailService.sendEndedSessionEmail({
				to: bussinesEmail,
				bussinesName,
				expertName,
				sessionDate,
				sessionTime
			})
		} catch (error) {
			console.error('Error sending ended session email:', error)
		}
		return updatedSession
	}

	async approved(id: number, file: Express.Multer.File) {
		const fullPath = this.fileUploadService.getFullPath('approved-session', file.filename)

		const session = await this.sessionRepository.findOne({
			where: { id },
			relations: ['accompaniment', 'accompaniment.business.user']
		})
		if (!session) {
			this.fileUploadService.deleteFile(fullPath)
			throw new BadRequestException(`Session with id ${id} not found`)
		}

		if(session.statusId !== 2) {
			this.fileUploadService.deleteFile(fullPath)
			throw new BadRequestException('Session is not in public status')
		}

		const updatedSession = await this.sessionRepository.update(id, { statusId: 3, filePathApproved: fullPath })

		if (!updatedSession) {
			this.fileUploadService.deleteFile(fullPath)
			throw new BadRequestException(`Failed to update session with id ${id}`)
		}

		try {
			const { email: bussinesEmail, name: bussinesName } = session.accompaniment?.business?.user || { email: '', name: '' }

			this.mailService.sendApprovedSessionEmailContext({
				to: bussinesEmail,
				bussinesName
			}, file)
		} catch (error) {
			console.error('Error sending approved session email:', error)
		}

		return updatedSession
	}

	async remove(id: number) {
		const session = await this.sessionRepository.findOne({ where: { id } })
		if (!session) return { affected: 0 }

		const sessionPreparationFiles = await this.sessionPreparationFileRepository.find({ where: { sessionId: id } })
		if (sessionPreparationFiles) {
			sessionPreparationFiles.forEach(file => {
				this.fileUploadService.deleteFile(file.filePath)
			})
			await this.sessionPreparationFileRepository.delete({ sessionId: id })
		}

		return this.sessionRepository.delete(id)
	}
}
