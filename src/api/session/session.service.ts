import { DataSource } from 'typeorm'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'

import { Session } from 'src/entities/Session'
import { Accompaniment } from 'src/entities/Accompaniment'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'
import { SessionAttachment } from 'src/entities/SessionAttachment'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionDto } from './dto/create-session.dto'
import { UpdateSessionDto } from './dto/update-session.dto'
import { ApprovedSessionDto } from './dto/approved-session.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { PdfService } from 'src/services/pdf/pdf.service'
import { DateService } from 'src/services/date/date.service'

import envVars from 'src/config/env'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Injectable()
export class SessionService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService,
		private readonly pdfService: PdfService,
		private readonly dateService: DateService
	) {}

	private async removeFiles(preparationFiles: string[]) {
		if (preparationFiles && preparationFiles.length) {
			preparationFiles.forEach(fullPath => {
				this.fileUploadService.deleteFile(fullPath)
			})
		}
	}

	private async getSessionWithRelations(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			return await sessionRepository.findOne({
				where: { id },
				relations: [
					'status',
					'accompaniment',
					'accompaniment.strengtheningAreas',
					'accompaniment.business.user',
					'accompaniment.business.economicActivities',
					'accompaniment.business.businessSize',
					'accompaniment.expert.user',
					'accompaniment.expert.strengtheningAreas',
					'accompaniment.expert.educationLevel',
					'accompaniment.expert.consultorType'
				]
			})
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	private async mapFiles(sessionId: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)
			const sessionAttachmentRepository = businessDataSource.getRepository(SessionAttachment)

			const preparationFilesData = await sessionPreparationFileRepository.find({ where: { sessionId } })
			const preparationFiles = preparationFilesData.map((file, index) => ({
				name: 'Archivo ' + (index + 1),
				filePath: envVars.APP_URL + '/' + file.filePath
			}))

			const attachmentsData = await sessionAttachmentRepository.find({ where: { sessionId } })
			const attachments = attachmentsData.map(file => ({
				name: file.name,
				filePath: file.externalPath ? file.externalPath : envVars.APP_URL + '/' + file.filePath
			}))

			return { preparationFiles, attachments }
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	private async generateSessionPdfData(session: Session, diffInHours: number, preparationFiles, attachments, options: {
		state: string,
		sign: boolean,
		signature?: string,
		signedDate?: string,
		generationDate?: string
	}, businessName: string) {
		const expertStrengtheningAreas = session.accompaniment?.expert?.strengtheningAreas || []
		const businessEconomicActivities = session.accompaniment?.business?.economicActivities || []
		const accompanimentStrengtheningAreas = session.accompaniment?.strengtheningAreas || []

		return this.pdfService.generateSessionPdf({
			bSocialReason: session.accompaniment?.business?.socialReason || 'No registra.',
			bPhone: session.accompaniment?.business?.phone || 'No registra.',
			bEmail: session.accompaniment?.business?.email || 'No registra.',
			bEconomicActivity: businessEconomicActivities.map(activity => activity.name).join(', ') || 'No registra.',
			bBusinessSize: session.accompaniment?.business?.businessSize?.name || 'No registra.',
			bFacebook: session.accompaniment?.business?.facebook || 'No registra.',
			bInstagram: session.accompaniment?.business?.instagram || 'No registra.',
			bTwitter: session.accompaniment?.business?.twitter || 'No registra.',
			bWebsite: session.accompaniment?.business?.website || 'No registra.',
			aStrengtheningArea: accompanimentStrengtheningAreas.map(area => area.name).join(', ') || 'No registra.',
			aTotalHours: session.accompaniment?.totalHours || 'No registra.',
			aRegisteredHours: diffInHours || 'No registra.',
			eType: session.accompaniment?.expert?.consultorType?.name || '',
			eName: session.accompaniment?.expert ? session.accompaniment.expert.firstName + ' ' + session.accompaniment.expert.lastName : 'No registra.',
			eEmail: session.accompaniment?.expert?.email || 'No registra.',
			ePhone: session.accompaniment?.expert?.phone || 'No registra.',
			eProfile: session.accompaniment?.expert?.profile || 'No registra.',
			eStrengtheningArea: expertStrengtheningAreas.map(area => area.name).join(', ') || 'No registra.',
			eEducationLevel: session.accompaniment?.expert?.educationLevel?.name || 'No registra.',
			stitle: session.title || 'No registra.',
			sPreparationNotes: session.preparationNotes || 'No registra.',
			sPreparationFiles: preparationFiles,
			sSessionNotes: session.sessionNotes || 'No registra.',
			sConclusionsCommitments: session.conclusionsCommitments || 'No registra.',
			sAttachments: attachments,
			state: options.state,
			generationDate: options.generationDate || this.dateService.formatDate(new Date()),
			sign: options.sign,
			signature: options.signature,
			signedDate: options.signedDate
		}, businessName)
	}

	async create(createSessionDto: CreateSessionDto, businessName: string, files?: Express.Multer.File[]) {
		if (!businessName) throw new BadRequestException('businessName es requerido')
		
		const { accompanimentId, title, startDatetime, endDatetime, conferenceLink, preparationNotes } = createSessionDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		const preparationFiles: string[] = []

		try {
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)
			const sessionRepository = businessDataSource.getRepository(Session)
			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)

			const accompaniment = await accompanimentRepository.findOne({
				where: { id: accompanimentId },
				relations: ['business', 'business.user', 'expert', 'expert.user']
			})

			if (!accompaniment) throw new NotFoundException('Acompañamiento no encontrado')

			const session = sessionRepository.create({
				accompanimentId,
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes
			})

			const savedSession = await sessionRepository.save(session)

			if (files && files.length > 0) {
				for (const file of files) {
					const filePath = this.fileUploadService.getFullPath('session-preparation', file.filename)
					preparationFiles.push(filePath)

					await sessionPreparationFileRepository.save({
						sessionId: savedSession.id,
						filePath
					})
				}
			}

			try {
				const sessionDateFormat = this.dateService.formatDate(new Date(session.startDatetime))

				const { email: businessEmail, name: businessUserName } = accompaniment.business?.user || { email: '', name: '' }
				const { email: expertMail, name: expertName } = accompaniment.expert?.user || { email: '', name: '' }

				this.mailService.sendNewSessionEmail({
					to: businessEmail,
					businessName: businessUserName,
					expertName,
					expertMail,
					startDate: session.startDatetime,
					endDate: session.endDatetime,
					sessionDateFormat,
					conferenceLink,
					preparationNotes
				}, businessName, files)
			} catch (e) {
				console.error('Error sending new session email:', e)
			}

			return savedSession
		} catch (e) {
			this.removeFiles(preparationFiles)
			throw e
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllByAccompaniment(accompanimentId: number, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Session>> {
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					s.id AS id,
					s.title AS title,
					a.id AS accompanimentId,
					a.business_id AS businessId,
					a.expert_id AS expertId,
					DATE_FORMAT(s.start_datetime, '%Y-%m-%d %H:%i:%s') AS startDatetime,
					DATE_FORMAT(s.end_datetime, '%Y-%m-%d %H:%i:%s') AS endDatetime,
					TIMESTAMPDIFF(MINUTE, s.start_datetime, s.end_datetime) AS duration,
					ss.name AS status,
					GROUP_CONCAT(CONCAT(?, "/", spf.file_path) SEPARATOR '||') AS preparationFiles
				FROM
					session s
					INNER JOIN accompaniment a ON s.accompaniment_id = a.id
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
				businessDataSource.query(sql, [envVars.APP_URL, accompanimentId]),
				businessDataSource.query(countSql, [accompanimentId])
			])

			const items = rawItems.map(item => {
				const preparationFiles = item.preparationFiles ? item.preparationFiles.split('||') : []

				return { ...item, preparationFiles }
			})

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllByBusinessForExpert(bussinesId: number, user: JwtUser, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Session>> {
		const { take, skip, order } = pageOptionsDto
		const { id: userId } = user

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					s.id AS id,
					s.title AS title,
					DATE_FORMAT(s.start_datetime, '%Y-%m-%d %H:%i:%s') AS startDatetime,
					DATE_FORMAT(s.end_datetime, '%Y-%m-%d %H:%i:%s') AS endDatetime,
					TIMESTAMPDIFF(MINUTE, s.start_datetime, s.end_datetime) AS duration,
					ss.name AS status,
					GROUP_CONCAT(CONCAT(?, "/", spf.file_path) SEPARATOR '||') AS preparationFiles
				FROM
					session s
					INNER JOIN accompaniment a ON s.accompaniment_id = a.id
					INNER JOIN expert e ON a.expert_id = e.id
					INNER JOIN session_status ss ON s.status_id = ss.id
					LEFT JOIN session_preparation_file spf ON spf.session_id = s.id
				WHERE e.user_id = ? AND a.business_id = ?
				GROUP BY s.id
				ORDER BY s.start_datetime ${order}
				LIMIT ${take} OFFSET ${skip}
			`

			const countSql = `
				SELECT COUNT(DISTINCT s.id) AS total
				FROM session s
				INNER JOIN accompaniment a ON s.accompaniment_id = a.id
				INNER JOIN expert e ON a.expert_id = e.id
				WHERE e.user_id = ? AND a.business_id = ?
			`

			const [rawItems, countResult] = await Promise.all([
				businessDataSource.query(sql, [envVars.APP_URL, userId, bussinesId]),
				businessDataSource.query(countSql, [userId, bussinesId])
			])

			const items = rawItems.map(item => {
				const preparationFiles = item.preparationFiles ? item.preparationFiles.split('||') : []

				return { ...item, preparationFiles }
			})

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllForBusiness(user: JwtUser, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Session>> {
		const { id: userId } = user
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			let businessId = await businessDataSource.query(`
				SELECT b.id
				FROM business b
				INNER JOIN user u ON b.user_id = u.id
				WHERE u.id = ?
			`, [userId])

			if (!businessId || !businessId.length) return new PageDto([], new PageMetaDto({ pageOptionsDto, totalCount: 0 }))

			businessId = businessId[0].id

			const sql = `
				SELECT
					s.id AS id,
					s.title AS title,
					e.id AS expertId,
					CONCAT(e.first_name, ' ', e.last_name) AS expertName,
					ct.name AS consultorType,
					ct.id AS consultorTypeId,
					DATE_FORMAT(s.start_datetime, '%Y-%m-%d %H:%i:%s') AS startDatetime,
					DATE_FORMAT(s.end_datetime, '%Y-%m-%d %H:%i:%s') AS endDatetime,
					TIMESTAMPDIFF(MINUTE, s.start_datetime, s.end_datetime) AS duration,
					ss.id AS statusId,
					ss.name AS status
				FROM
					session s
					INNER JOIN accompaniment a ON s.accompaniment_id = a.id
					INNER JOIN expert e ON a.expert_id = e.id
					INNER JOIN consultor_type ct ON e.consultor_type_id = ct.id
					INNER JOIN session_status ss ON s.status_id = ss.id
					LEFT JOIN session_preparation_file spf ON spf.session_id = s.id
				WHERE a.business_id = ?
				GROUP BY s.id
				ORDER BY s.start_datetime ${order}
				LIMIT ${take} OFFSET ${skip}
			`

			const countSql = `
				SELECT COUNT(DISTINCT s.id) AS total
				FROM session s
				INNER JOIN accompaniment a ON s.accompaniment_id = a.id
				WHERE a.business_id = ?
			`

			const [rawItems, countResult] = await Promise.all([
				businessDataSource.query(sql, [businessId]),
				businessDataSource.query(countSql, [businessId])
			])

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(rawItems, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllByFilter(filter: string, businessName: string) {
		if(!filter) return []

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const session = await sessionRepository
				.createQueryBuilder('s')
				.select([
					's.id AS value',
					'CONCAT(s.title, " - ", DATE_FORMAT(s.start_datetime, "%Y-%m-%d %H:%i"), " / ", DATE_FORMAT(s.end_datetime, "%Y-%m-%d %H:%i")) AS label'
				])
				.where('s.title LIKE :filter', { filter: `%${filter}%` })
				.take(10)
				.setParameters({ appUrl: envVars.APP_URL })
				.getRawMany()

			return session || []
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findOne(user: JwtUser, id: number, businessName: string) {
		const { id: userId, roleId } = user
		if (!id) return {}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const rawSession = await sessionRepository
				.createQueryBuilder('session')
				.select([
					'session.id AS id',
					'session.accompanimentId AS accompanimentId',
					'session.title AS title',
					'accompaniment.businessId AS businessId',
					'accompaniment.expertId AS expertId',
					`DATE_FORMAT(session.startDatetime, '%Y-%m-%d %H:%i:%s') AS startDatetime`,
					`DATE_FORMAT(session.endDatetime, '%Y-%m-%d %H:%i:%s') AS endDatetime`,
					'TIMESTAMPDIFF(MINUTE, session.startDatetime, session.endDatetime) AS duration',
					'session.conferenceLink AS conferenceLink',
					'session.preparationNotes AS preparationNotes',
					'session.sessionNotes AS sessionNotes',
					'session.conclusionsCommitments AS conclusionsCommitments',
					'CONCAT(:appUrl, "/", session.file_path_unapproved) AS filePathUnapproved',
					'CONCAT(:appUrl, "/", session.file_path_approved) AS filePathApproved',
					'status.id AS statusId',
					'status.name AS status',
					`(
						SELECT GROUP_CONCAT(CONCAT(:appUrl, "/", spf.file_path) SEPARATOR '||')
						FROM session_preparation_file spf
						WHERE spf.session_id = session.id
					) AS preparationFiles`,
					`(
						SELECT GROUP_CONCAT(CONCAT(:appUrl, "/", sa.file_path) SEPARATOR '||')
						FROM session_attachment sa
						WHERE sa.session_id = session.id
					) AS attachments`
				])
				.innerJoin('session.status', 'status')
				.innerJoin('session.accompaniment', 'accompaniment')
				.innerJoin('accompaniment.business', 'business')
				.innerJoin('accompaniment.expert', 'expert')
				.leftJoin('session.sessionAttachments', 'sa', 'sa.session_id = session.id')
				.leftJoin('session_preparation_file', 'spf', 'spf.session_id = session.id')
				.where('session.id = :id', { id })
				.andWhere(roleId !== 1 && roleId !== 2 ? '(business.userId = :userId OR expert.userId = :userId)' : '1=1', { userId })
				.groupBy('session.id')
				.setParameters({ appUrl: envVars.APP_URL })
				.getRawOne()

			if (!rawSession) return {}

			return {
				...rawSession,
				preparationFiles: rawSession.preparationFiles ? rawSession.preparationFiles.split('||') : [],
				attachments: rawSession.attachments ? rawSession.attachments.split('||') : []
			}
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async update(id: number, updateSessionDto: UpdateSessionDto, businessName: string, files?: Express.Multer.File[]) {
		if (!businessName) throw new BadRequestException('businessName es requerido')
		
		const preparationFiles = files?.length ? files.map(file => {
			return this.fileUploadService.getFullPath('session-preparation', file.filename)
		}) : []

		if(!id) {
			this.removeFiles(preparationFiles)
			return { affected: 0 }
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)
			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)

			const session = await sessionRepository.findOne({ where: { id } })
			if (!session) {
				this.removeFiles(preparationFiles)
				throw new BadRequestException(`Sesión con id ${id} no encontrada`)
			}

			const accompaniment = await accompanimentRepository.findOne({
				where: { id: session.accompanimentId },
				relations: ['sessions']
			})
			if (!accompaniment) {
				this.removeFiles(preparationFiles)
				throw new BadRequestException(`Acompañamiento con id ${session.accompanimentId} no encontrado`)
			}

			const {
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes,
				sessionNotes,
				conclusionsCommitments
			} = updateSessionDto

			if(startDatetime && endDatetime) {
				const startDate = this.dateService.parseToDate(startDatetime)
				const endDate = this.dateService.parseToDate(endDatetime)
				const now = this.dateService.getNow()

				const diffInHours = this.dateService.getHoursDiff(startDate, endDate)

				if (diffInHours > accompaniment.maxHoursPerSession) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException(`La duración de la sesión no puede ser mayor a ${accompaniment.maxHoursPerSession} horas`)
				}

				if (diffInHours <= 0) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException('La fecha de inicio debe ser menor a la fecha de fin')
				}

				if (startDate < now || endDate < now) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException('La fecha de inicio y fin deben ser posteriores a la actual')
				}

				const assignedHours = accompaniment.sessions
				.filter(session => [1, 2, 3].includes(session.statusId))
				.reduce((total, session) => {
					const sessionHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)
					return total + sessionHours
				}, 0)

				if (assignedHours + diffInHours > accompaniment.totalHours) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException(`La sesión excede las horas totales permitidas del acompañamiento. Horas disponibles: ${accompaniment.totalHours - assignedHours}`)
				}

			}

			const sessionPreparationFiles = preparationFiles.map(fullPath => {
				return sessionPreparationFileRepository.create({
					sessionId: id,
					filePath: fullPath
				})
			})

			await sessionPreparationFileRepository.save(sessionPreparationFiles)

			return sessionRepository.update(id, {
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes,
				sessionNotes,
				conclusionsCommitments
			})
		} catch (e) {
			this.removeFiles(preparationFiles)
			throw e
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async public(id: number, businessName: string) {
		const session = await this.getSessionWithRelations(id, businessName)

		if (!session) throw new BadRequestException(`Sesión con id ${id} no encontrada`)
		if (session.statusId !== 1) throw new BadRequestException('La sesión no está en estado creada')

		const { preparationFiles, attachments } = await this.mapFiles(id, businessName)

		const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)
		const generationDate = this.dateService.getFormattedNow()

		const file = await this.generateSessionPdfData(session, diffInHours, preparationFiles, attachments, {
			state: 'Publicada',
			sign: false,
			generationDate
		}, businessName)

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const updatedSession = await sessionRepository.update(id, {
				statusId: 2,
				filePathUnapproved: file.filePath,
				fileGenerationDatetime: this.dateService.getNow()
			})
			if (!updatedSession) throw new BadRequestException(`No se pudo actualizar la sesión con id ${id}`)

			try {
				const sessionDateTime = this.dateService.formatDate(this.dateService.parseToDate(session.startDatetime))
				const { email: businessEmail, name: businessUserName } = session.accompaniment?.business?.user || { email: '', name: '' }
				const { email: expertMail, name: expertName } = session.accompaniment?.expert?.user || { email: '', name: '' }

				this.mailService.sendEndedSessionEmail({
					sessionId: session.id,
					to: businessEmail,
					businessName: businessUserName,
					expertName,
					expertMail,
					sessionDateTime
				}, businessName)
			} catch (e) {
				console.error('Error sending ended session email:', e)
			}

			return updatedSession
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async approved(id: number, { signature, status }: ApprovedSessionDto, businessName: string) {
		const session = await this.getSessionWithRelations(id, businessName)

		if (!session) throw new BadRequestException(`Sesión con id ${id} no encontrada`)
		if (session.statusId !== 2) throw new BadRequestException('La sesión no está en estado publicada')
		if (!session.filePathUnapproved) throw new BadRequestException('La sesión no tiene un archivo para aprobar')

		const { preparationFiles, attachments } = await this.mapFiles(id, businessName)

		const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)
		const generationDate = this.dateService.formatDate(session.fileGenerationDatetime || new Date())
		const signedDate = this.dateService.formatDate(this.dateService.getNow())

		const file = await this.generateSessionPdfData(session, diffInHours, preparationFiles, attachments, {
			state: !status ? 'Rechazada' : 'Aprobada',
			sign: true,
			signature,
			signedDate,
			generationDate
		}, businessName)

		const statusId = status ? 3 : 4

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const updatedSession = await sessionRepository.update(id, { statusId, filePathApproved: file.filePath })
			if (!updatedSession) throw new BadRequestException(`No se pudo actualizar la sesión con id ${id}`)

			try {
				const { email: businessEmail, name: businessUserName } = session.accompaniment?.business?.user || { email: '', name: '' }
				const { email: expertMail } = session.accompaniment?.expert?.user || { email: '', name: '' }

				this.mailService.sendApprovedSessionEmailContext({
					to: businessEmail,
					businessName: businessUserName,
					expertMail
				}, file, businessName)
			} catch (e) {
				console.error('Error sending approved session email:', e)
			}

			return updatedSession
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async remove(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)

			const session = await sessionRepository.findOne({ where: { id } })
			if (!session) return { affected: 0 }

			if(session.statusId !== 1) {
				throw new BadRequestException('No se puede eliminar una sesión que no está en estado creada')
			}

			const sessionPreparationFiles = await sessionPreparationFileRepository.find({ where: { sessionId: id } })
			if (sessionPreparationFiles) {
				sessionPreparationFiles.forEach(file => {
					this.fileUploadService.deleteFile(file.filePath)
				})
				await sessionPreparationFileRepository.delete({ sessionId: id })
			}

			return sessionRepository.delete(id)
		} catch (e) {
			throw new Error(`No se pudo eliminar la sesión`)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
