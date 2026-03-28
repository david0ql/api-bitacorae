import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { In, Repository } from 'typeorm'

import { Session } from 'src/entities/Session'
import { Accompaniment } from 'src/entities/Accompaniment'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'
import { SessionActivity } from 'src/entities/SessionActivity'
import { RequestAttachment } from 'src/entities/RequestAttachment'
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
import { RequestAttachmentService } from 'src/services/request-attachment/request-attachment.service'
import { REQUEST_ATTACHMENT_TYPES } from 'src/services/request-attachment/request-attachment.constants'

import envVars from 'src/config/env'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Injectable()
export class SessionService {
	private static readonly HOURS_PRECISION = 2

	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService,
		private readonly pdfService: PdfService,
		private readonly dateService: DateService,
		private readonly requestAttachmentService: RequestAttachmentService
	) {}

	private async removeFiles(preparationFiles: string[]) {
		if (preparationFiles && preparationFiles.length) {
			preparationFiles.forEach(fullPath => {
				this.fileUploadService.deleteFile(fullPath)
			})
		}
	}

	private getAbsoluteFileUrl(filePath?: string | null) {
		if (!filePath) return ''
		return filePath.startsWith('http') ? filePath : `${envVars.APP_URL}/${filePath}`
	}

	private getDisplayFileName(filePathOrUrl?: string | null, fallback = 'Archivo') {
		if (!filePathOrUrl) return fallback

		const cleanPath = filePathOrUrl.split('?')[0].split('#')[0]
		const parts = cleanPath.split('/')
		const encodedFileName = parts[parts.length - 1] || cleanPath
		let rawFileName = encodedFileName
		try {
			rawFileName = decodeURIComponent(encodedFileName)
		} catch {
			rawFileName = encodedFileName
		}
		if (!rawFileName) return fallback

		// Stored names are persisted as "<safeName>-<timestamp>.<ext>"; remove suffix for display.
		const withoutTimestamp = rawFileName.replace(/-\d{13}(?=\.[^.]+$)/, '')
		const normalized = withoutTimestamp.replace(/_/g, ' ').trim()

		return normalized || fallback
	}

	private buildBusinessMailDisplayName(userName?: string, socialReason?: string) {
		const safeUserName = userName?.trim() || ''
		const safeSocialReason = socialReason?.trim() || ''
		if (safeUserName && safeSocialReason) return `${safeUserName} - ${safeSocialReason}`
		return safeUserName || safeSocialReason || ''
	}

	private roundHours(value: number) {
		return Number(value.toFixed(SessionService.HOURS_PRECISION))
	}

	private formatHours(value: number) {
		const roundedValue = this.roundHours(Math.max(value, 0))
		return Number.isInteger(roundedValue) ? String(roundedValue) : String(roundedValue)
	}

	private getSessionDurationHours(start: string | Date, end: string | Date) {
		const startDate = this.dateService.parseToDate(start)
		const endDate = this.dateService.parseToDate(end)

		const durationMs = endDate.getTime() - startDate.getTime()
		return durationMs / (1000 * 60 * 60)
	}

	private async getAssignedSessionHours(
		sessionRepository: Repository<Session>,
		accompanimentId: number,
		excludeSessionId?: number
	) {
		const query = sessionRepository
			.createQueryBuilder('session')
			.select('COALESCE(SUM(TIMESTAMPDIFF(MINUTE, session.startDatetime, session.endDatetime)), 0)', 'assignedMinutes')
			.where('session.accompanimentId = :accompanimentId', { accompanimentId })

		if (excludeSessionId) {
			query.andWhere('session.id != :excludeSessionId', { excludeSessionId })
		}

		const result = await query.getRawOne()
		return this.roundHours(Number(result?.assignedMinutes || 0) / 60)
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
					'accompaniment.business.service',
					'accompaniment.expert.user',
					'accompaniment.expert.strengtheningAreas',
					'accompaniment.expert.educationLevel',
					'accompaniment.expert.consultorType',
					'sessionActivities',
					'sessionActivities.sessionActivityResponses'
				]
			})
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	private async mapFiles(sessionId: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)

			const preparationFilesData = await sessionPreparationFileRepository.find({ where: { sessionId } })
			const preparationFiles = preparationFilesData.map((file, index) => ({
				name: this.getDisplayFileName(file.filePath, `Archivo ${index + 1}`),
				filePath: this.getAbsoluteFileUrl(file.filePath)
			}))

			const attachmentsData = await this.requestAttachmentService.findByRequest({
				businessName,
				requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT,
				requestId: sessionId
			})
			const attachments = attachmentsData.map(file => ({
				name: file.name,
				filePath: file.fileUrl || ''
			}))

			return { preparationFiles, attachments }
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
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

		// Mapear las actividades de la sesión
		const sessionActivities = session.sessionActivities?.map(activity => ({
			title: activity.title,
			description: activity.description,
			requiresDeliverable: activity.requiresDeliverable ? 'Sí' : 'No',
			dueDatetime: this.dateService.formatDate(activity.dueDatetime),
			attachmentPath: activity.attachmentPath ? (activity.attachmentPath.startsWith('http') ? activity.attachmentPath : `${envVars.APP_URL}/${activity.attachmentPath}`) : null,
			responses: activity.sessionActivityResponses?.map(response => ({
				message: response.deliverableDescription || 'Sin descripción',
				attachmentPath: response.deliverableFilePath ? (response.deliverableFilePath.startsWith('http') ? response.deliverableFilePath : `${envVars.APP_URL}/${response.deliverableFilePath}`) : null,
				createdAt: this.dateService.formatDate(response.respondedDatetime)
			})) || []
		})) || []

		return this.pdfService.generateSessionPdf({
			bSocialReason: session.accompaniment?.business?.socialReason || 'No registra.',
			bPhone: session.accompaniment?.business?.phone || 'No registra.',
			bEmail: session.accompaniment?.business?.email || 'No registra.',
			bEconomicActivity: businessEconomicActivities.map(activity => activity.name).join(', ') || 'No registra.',
			bBusinessSize: session.accompaniment?.business?.businessSize?.name || 'No registra.',
			bService: session.accompaniment?.business?.service?.name || 'No registra.',
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
			sSessionActivities: sessionActivities,
			state: options.state,
			generationDate: options.generationDate || this.dateService.formatDate(new Date()),
			sign: options.sign,
			signature: options.signature,
			signedDate: options.signedDate
		}, businessName)
	}

	async create(createSessionDto: CreateSessionDto, businessName: string, files?: Express.Multer.File[]) {
		console.log('🚀 [SESSION CREATE] Iniciando creación de sesión')
		console.log('📝 [SESSION CREATE] DTO recibido:', JSON.stringify(createSessionDto, null, 2))
		console.log('🏢 [SESSION CREATE] Business name (dbName):', businessName)
		console.log('📎 [SESSION CREATE] Files:', files?.length || 0, 'archivos')

		if (!businessName) throw new BadRequestException('businessName es requerido')
		
		const { accompanimentId, title, startDatetime, endDatetime, conferenceLink, preparationNotes } = createSessionDto

		console.log('🔍 [SESSION CREATE] Buscando conexión a BD para business:', businessName)
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		console.log('✅ [SESSION CREATE] Conexión a BD establecida')

		const preparationFiles: string[] = []

		try {
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)
			const sessionRepository = businessDataSource.getRepository(Session)
			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)

			console.log('🔍 [SESSION CREATE] Buscando acompañamiento con ID:', accompanimentId)
			const accompaniment = await accompanimentRepository.findOne({
				where: { id: accompanimentId },
				relations: ['business', 'business.user', 'expert', 'expert.user']
			})

			if (!accompaniment) {
				console.log('❌ [SESSION CREATE] Acompañamiento no encontrado con ID:', accompanimentId)
				throw new NotFoundException('Acompañamiento no encontrado')
			}
			console.log('✅ [SESSION CREATE] Acompañamiento encontrado:', {
				id: accompaniment.id,
				businessId: accompaniment.business?.id,
				expertId: accompaniment.expert?.id,
				minimumHours: accompaniment.minimumHours,
				maxHoursPerSession: accompaniment.maxHoursPerSession,
				businessUser: accompaniment.business?.user ? {
					email: accompaniment.business.user.email,
					name: accompaniment.business.user.name
				} : null,
				expertUser: accompaniment.expert?.user ? {
					email: accompaniment.expert.user.email,
					name: accompaniment.expert.user.name
				} : null
			})

			// Validar duración de la sesión
			const startDate = new Date(startDatetime)
			const endDate = new Date(endDatetime)
			const durationHours = this.getSessionDurationHours(startDate, endDate)

			console.log('⏱️ [SESSION CREATE] Validando duración:', {
				startDatetime,
				endDatetime,
				durationHours,
				minimumHours: accompaniment.minimumHours,
				maxHoursPerSession: accompaniment.maxHoursPerSession
			})

			if (durationHours <= 0) {
				throw new BadRequestException('La fecha de finalización debe ser posterior a la fecha de inicio')
			}

			if (durationHours < accompaniment.minimumHours) {
				throw new BadRequestException(`La duración mínima de la sesión debe ser de ${accompaniment.minimumHours} hora(s)`)
			}

			if (durationHours > accompaniment.maxHoursPerSession) {
				throw new BadRequestException(`La duración máxima de la sesión debe ser de ${accompaniment.maxHoursPerSession} hora(s)`)
			}

			const assignedHours = await this.getAssignedSessionHours(sessionRepository, accompanimentId)
			const remainingHours = this.roundHours(accompaniment.totalHours - assignedHours)

			if (assignedHours + durationHours > accompaniment.totalHours) {
				throw new BadRequestException(`La sesión excede las horas totales permitidas del acompañamiento. Horas disponibles: ${this.formatHours(remainingHours)}`)
			}

			console.log('✅ [SESSION CREATE] Validación de duración exitosa')

			const session = sessionRepository.create({
				accompanimentId,
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes
			})

			console.log('💾 [SESSION CREATE] Guardando sesión en BD...')
			const savedSession = await sessionRepository.save(session)
			console.log('✅ [SESSION CREATE] Sesión guardada con ID:', savedSession.id)

			if (files && files.length > 0) {
				console.log('📎 [SESSION CREATE] Procesando', files.length, 'archivos...')
				for (const file of files) {
					const filePath = this.fileUploadService.getFullPath('session-preparation', file.filename)
					preparationFiles.push(filePath)

					await sessionPreparationFileRepository.save({
						sessionId: savedSession.id,
						filePath
					})
				}
				console.log('✅ [SESSION CREATE] Archivos procesados')
			}

			console.log('📧 [SESSION CREATE] Iniciando envío de correo...')
			try {
				const sessionDateFormat = this.dateService.formatDate(new Date(session.startDatetime))
				console.log('📅 [SESSION CREATE] Fecha formateada:', sessionDateFormat)

				const { email: businessEmail, name: businessUserName } = accompaniment.business?.user || { email: '', name: '' }
				const businessDisplayName = this.buildBusinessMailDisplayName(businessUserName, accompaniment.business?.socialReason)
				const { email: expertMail, name: expertName } = accompaniment.expert?.user || { email: '', name: '' }

				console.log('👥 [SESSION CREATE] Datos de usuarios:')
				console.log('  - Business email:', businessEmail)
				console.log('  - Business name:', businessDisplayName)
				console.log('  - Expert email:', expertMail)
				console.log('  - Expert name:', expertName)

				const emailContext = {
					to: businessEmail,
					businessName: businessDisplayName,
					expertName,
					expertMail,
					startDate: session.startDatetime,
					endDate: session.endDatetime,
					sessionDateFormat,
					conferenceLink,
					preparationNotes
				}

				console.log('📧 [SESSION CREATE] Contexto del correo:', JSON.stringify(emailContext, null, 2))
				console.log('📧 [SESSION CREATE] Llamando a mailService.sendNewSessionEmail...')
				console.log('📧 [SESSION CREATE] Usando dbName para conexión:', businessName)

				const emailResult = await this.mailService.sendNewSessionEmail(emailContext, businessName, files)
				console.log('✅ [SESSION CREATE] Correo enviado exitosamente:', emailResult)
			} catch (e) {
				console.error('❌ [SESSION CREATE] Error sending new session email:', e)
				console.error('❌ [SESSION CREATE] Stack trace:', e.stack)
			}

			console.log('🎉 [SESSION CREATE] Sesión creada exitosamente, retornando:', savedSession.id)
			return savedSession
		} catch (e) {
			console.error('❌ [SESSION CREATE] Error general en create:', e)
			this.removeFiles(preparationFiles)
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
			// console.log('🔒 [SESSION CREATE] Conexión a BD cerrada')
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
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
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
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAllByFilter(filter: string, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			
			// If filter is empty or undefined, return all sessions
			if (!filter || filter.trim() === '') {
				const result = await sessionRepository
					.createQueryBuilder('s')
					.select([
						's.id AS value',
						'CONCAT(s.title, " - ", DATE_FORMAT(s.start_datetime, "%Y-%m-%d %H:%i"), " / ", DATE_FORMAT(s.end_datetime, "%Y-%m-%d %H:%i")) AS label'
					])
					.orderBy('s.startDatetime', 'DESC')
					.take(10)
					.getRawMany()
				return result || []
			}
			
			// Otherwise, filter by title
			const result = await sessionRepository
				.createQueryBuilder('s')
				.select([
					's.id AS value',
					'CONCAT(s.title, " - ", DATE_FORMAT(s.start_datetime, "%Y-%m-%d %H:%i"), " / ", DATE_FORMAT(s.end_datetime, "%Y-%m-%d %H:%i")) AS label'
				])
				.where('s.title LIKE :filter', { filter: `%${filter}%` })
				.orderBy('s.startDatetime', 'DESC')
				.take(10)
				.getRawMany()
			return result || []
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
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
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findOne(user: JwtUser, id: number, businessName: string) {
		const { id: userId, roleId } = user
		if (!id) return {}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			await this.requestAttachmentService.ensureHomologated(businessName)
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
						SELECT GROUP_CONCAT(
							CASE
								WHEN ra.external_path IS NOT NULL AND ra.external_path <> '' THEN ra.external_path
								WHEN ra.file_path IS NOT NULL AND ra.file_path <> '' THEN CONCAT(:appUrl, "/", ra.file_path)
								ELSE NULL
							END
							SEPARATOR '||'
						)
						FROM request_attachment ra
						WHERE ra.request_type = :requestType
							AND ra.request_id = session.id
					) AS attachments`
				])
				.innerJoin('session.status', 'status')
				.innerJoin('session.accompaniment', 'accompaniment')
				.innerJoin('accompaniment.business', 'business')
				.innerJoin('accompaniment.expert', 'expert')
				.leftJoin('session_preparation_file', 'spf', 'spf.session_id = session.id')
				.where('session.id = :id', { id })
				.andWhere(roleId !== 1 && roleId !== 2 ? '(business.userId = :userId OR expert.userId = :userId)' : '1=1', { userId })
				.groupBy('session.id')
				.setParameters({ appUrl: envVars.APP_URL, requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT })
				.getRawOne()

			if (!rawSession) return {}

			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)
			const sessionPreparationFiles = await sessionPreparationFileRepository.find({
				where: { sessionId: id },
				order: { id: 'ASC' }
			})

			const preparationFilesData = sessionPreparationFiles.map((file, index) => ({
				name: this.getDisplayFileName(file.filePath, `Archivo ${index + 1}`),
				fileUrl: this.getAbsoluteFileUrl(file.filePath)
			}))

			const sessionAttachmentsRaw = await this.requestAttachmentService.findByRequest({
				businessName,
				requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT,
				requestId: id
			})

			const attachmentsData = sessionAttachmentsRaw.map((item, index) => ({
				id: item.id,
				name: item.name || this.getDisplayFileName(item.fileUrl || item.filePath, `Archivo adjunto ${index + 1}`),
				fileUrl: item.fileUrl || this.getAbsoluteFileUrl(item.filePath),
				externalPath: item.externalPath
			}))

			return {
				...rawSession,
				preparationFiles: preparationFilesData.map((item) => item.fileUrl),
				attachments: attachmentsData.map((item) => item.fileUrl),
				preparationFilesData,
				attachmentsData
			}
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateSessionDto: UpdateSessionDto, businessName: string, files?: Express.Multer.File[]) {
		console.log('🔍 [SESSION UPDATE] Starting update with:', { id, businessName, updateSessionDto })
		
		if (!businessName) throw new BadRequestException('businessName es requerido')
		
		const preparationFiles = files?.length ? files.map(file => {
			return this.fileUploadService.getFullPath('session-preparation', file.filename)
		}) : []

		if(!id) {
			this.removeFiles(preparationFiles)
			return { affected: 0 }
		}

		console.log('🔍 [SESSION UPDATE] Getting business connection for:', businessName)
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		
		console.log('🔍 [SESSION UPDATE] Business connection established successfully')

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const accompanimentRepository = businessDataSource.getRepository(Accompaniment)
			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)

			const session = await sessionRepository.findOne({ where: { id } })
			if (!session) {
				this.removeFiles(preparationFiles)
				throw new BadRequestException(`Sesión con id ${id} no encontrada`)
			}

			const accompaniment = await accompanimentRepository.findOne({ where: { id: session.accompanimentId } })
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

				const diffInHours = this.getSessionDurationHours(startDate, endDate)

				if (diffInHours <= 0) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException('La fecha de inicio debe ser menor a la fecha de fin')
				}

				if (diffInHours < accompaniment.minimumHours) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException(`La duración mínima de la sesión debe ser de ${accompaniment.minimumHours} hora(s)`)
				}

				if (diffInHours > accompaniment.maxHoursPerSession) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException(`La duración máxima de la sesión debe ser de ${accompaniment.maxHoursPerSession} hora(s)`)
				}

				if (startDate < now || endDate < now) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException('La fecha de inicio y fin deben ser posteriores a la actual')
				}

				const assignedHours = await this.getAssignedSessionHours(sessionRepository, accompaniment.id, session.id)
				const remainingHours = this.roundHours(accompaniment.totalHours - assignedHours)

				if (assignedHours + diffInHours > accompaniment.totalHours) {
					this.removeFiles(preparationFiles)
					throw new BadRequestException(`La sesión excede las horas totales permitidas del acompañamiento. Horas disponibles: ${this.formatHours(remainingHours)}`)
				}

			}

			const sessionPreparationFiles = preparationFiles.map(fullPath => {
				return sessionPreparationFileRepository.create({
					sessionId: id,
					filePath: fullPath
				})
			})

			await sessionPreparationFileRepository.save(sessionPreparationFiles)

			console.log('🔍 [SESSION UPDATE] About to update session with data:', {
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes,
				sessionNotes,
				conclusionsCommitments
			})

			const updateResult = await sessionRepository.update(id, {
				title,
				startDatetime,
				endDatetime,
				conferenceLink,
				preparationNotes,
				sessionNotes,
				conclusionsCommitments
			})

			console.log('🔍 [SESSION UPDATE] Update result:', updateResult)
			return updateResult
		} catch (e) {
			this.removeFiles(preparationFiles)
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
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
				const businessDisplayName = this.buildBusinessMailDisplayName(businessUserName, session.accompaniment?.business?.socialReason)
				const { email: expertMail, name: expertName } = session.accompaniment?.expert?.user || { email: '', name: '' }

				this.mailService.sendEndedSessionEmail({
					sessionId: session.id,
					to: businessEmail,
					businessName: businessDisplayName,
					expertName,
					expertMail,
					sessionDateTime
				}, businessName)
			} catch (e) {
				console.error('Error sending ended session email:', e)
			}

			return updatedSession
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
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
				const businessDisplayName = this.buildBusinessMailDisplayName(businessUserName, session.accompaniment?.business?.socialReason)
				const { email: expertMail, name: expertName } = session.accompaniment?.expert?.user || { email: '', name: '' }
				
				const sessionDate = this.dateService.formatDate(session.startDatetime)

				this.mailService.sendApprovedSessionEmailContext({
					to: businessEmail,
					businessName: businessDisplayName,
					expertName: expertName,
					expertMail,
					sessionDateTime: sessionDate,
					isApproved: status,
					signature,
					rejectedDate: !status ? signedDate : undefined
				}, file, businessName)
			} catch (e) {
				console.error('Error sending approved/rejected session email:', e)
			}

			return updatedSession
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		console.log('🗑️ [SESSION REMOVE] Iniciando eliminación de sesión')
		console.log('🗑️ [SESSION REMOVE] ID:', id)
		console.log('🗑️ [SESSION REMOVE] Business name:', businessName)

		console.log('🔍 [SESSION REMOVE] Obteniendo conexión a BD...')
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) {
			console.error('❌ [SESSION REMOVE] No se pudo conectar a la BD')
			throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		}
		console.log('✅ [SESSION REMOVE] Conexión a BD establecida')

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const sessionPreparationFileRepository = businessDataSource.getRepository(SessionPreparationFile)
			const requestAttachmentRepository = businessDataSource.getRepository(RequestAttachment)
			const sessionActivityRepository = businessDataSource.getRepository(SessionActivity)

			console.log('🔍 [SESSION REMOVE] Buscando sesión con ID:', id)
			const session = await sessionRepository.findOne({ where: { id } })
			if (!session) {
				console.log('⚠️ [SESSION REMOVE] Sesión no encontrada')
				return { affected: 0 }
			}
			console.log('✅ [SESSION REMOVE] Sesión encontrada:', {
				id: session.id,
				title: session.title,
				statusId: session.statusId
			})

			if(session.statusId !== 1) {
				console.log('❌ [SESSION REMOVE] Sesión no está en estado creada (statusId:', session.statusId, ')')
				throw new BadRequestException('No se puede eliminar una sesión que no está en estado creada')
			}

			await this.requestAttachmentService.ensureHomologated(businessName)

			const sessionAttachments = await requestAttachmentRepository.find({
				where: {
					requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT,
					requestId: id
				}
			})

			sessionAttachments.forEach((attachment) => {
				if (attachment.filePath) {
					this.fileUploadService.deleteFile(attachment.filePath)
				}
			})

			if (sessionAttachments.length > 0) {
				await requestAttachmentRepository.delete({
					requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT,
					requestId: id
				})
			}

			const sessionActivities = await sessionActivityRepository.find({
				select: { id: true },
				where: { sessionId: id }
			})

			const sessionActivityIds = sessionActivities.map(activity => activity.id)
			if (sessionActivityIds.length > 0) {
				const activityAttachments = await requestAttachmentRepository.find({
					where: {
						requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ACTIVITY_ATTACHMENT,
						requestId: In(sessionActivityIds)
					}
				})

				activityAttachments.forEach((attachment) => {
					if (attachment.filePath) {
						this.fileUploadService.deleteFile(attachment.filePath)
					}
				})

				await requestAttachmentRepository.delete({
					requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ACTIVITY_ATTACHMENT,
					requestId: In(sessionActivityIds)
				})
			}

			console.log('🔍 [SESSION REMOVE] Buscando archivos de preparación...')
			const sessionPreparationFiles = await sessionPreparationFileRepository.find({ where: { sessionId: id } })
			if (sessionPreparationFiles && sessionPreparationFiles.length > 0) {
				console.log('📎 [SESSION REMOVE] Eliminando', sessionPreparationFiles.length, 'archivos de preparación...')
				sessionPreparationFiles.forEach(file => {
					console.log('🗑️ [SESSION REMOVE] Eliminando archivo:', file.filePath)
					this.fileUploadService.deleteFile(file.filePath)
				})
				await sessionPreparationFileRepository.delete({ sessionId: id })
				console.log('✅ [SESSION REMOVE] Archivos de preparación eliminados')
			} else {
				console.log('📎 [SESSION REMOVE] No hay archivos de preparación para eliminar')
			}

			console.log('🗑️ [SESSION REMOVE] Eliminando sesión de la BD...')
			const result = await sessionRepository.delete(id)
			console.log('✅ [SESSION REMOVE] Sesión eliminada exitosamente:', result)
			return result
		} catch (e) {
			console.error('❌ [SESSION REMOVE] Error eliminando sesión:', e)
			console.error('❌ [SESSION REMOVE] Stack trace:', e.stack)
			throw new Error(`No se pudo eliminar la sesión: ${e.message}`)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
			// console.log('🔒 [SESSION REMOVE] Conexión a BD cerrada')
		}
	}
}
