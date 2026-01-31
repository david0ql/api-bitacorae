import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { Report } from 'src/entities/Report'
import { Business } from 'src/entities/Business'
import { Expert } from 'src/entities/Expert'
import { Session } from 'src/entities/Session'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'
import { SessionActivity } from 'src/entities/SessionActivity'
import { Business as AdminBusiness } from 'src/entities/admin/Business'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateReportDto } from './dto/create-report.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DateService } from 'src/services/date/date.service'
import { PdfService } from 'src/services/pdf/pdf.service'
import envVars from 'src/config/env'
import { RequestAttachmentService } from 'src/services/request-attachment/request-attachment.service'
import { REQUEST_ATTACHMENT_TYPES } from 'src/services/request-attachment/request-attachment.constants'
import { InjectDataSource } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Injectable()
export class ReportService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly dateService: DateService,
		private readonly pdfService: PdfService,
		private readonly requestAttachmentService: RequestAttachmentService,
		@InjectDataSource(envVars.DB_ALIAS_ADMIN)
		private readonly adminDataSource: DataSource
	) {}

	private async getSessionWithRelations(sessionId: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			return await sessionRepository.findOne({
				where: { id: sessionId },
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
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	private async getBusinessWithRelations(businessId: number, businessName: string, expertId?: number) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const query = businessRepository.createQueryBuilder('business')
				.leftJoinAndSelect('business.user', 'user')
				.leftJoinAndSelect('business.economicActivities', 'economicActivities')
				.leftJoinAndSelect('business.businessSize', 'businessSize')
				.leftJoinAndSelect('business.accompaniments', 'accompaniments')
				.leftJoinAndSelect('accompaniments.strengtheningAreas', 'strengtheningAreas')
				.leftJoinAndSelect('accompaniments.expert', 'expert')
				.leftJoinAndSelect('expert.user', 'expertUser')
				.leftJoinAndSelect('expert.strengtheningAreas', 'expertStrengtheningAreas')
				.leftJoinAndSelect('expert.educationLevel', 'educationLevel')
				.leftJoinAndSelect('expert.consultorType', 'consultorType')
				.leftJoinAndSelect('accompaniments.sessions', 'sessions')
				.leftJoinAndSelect('sessions.status', 'status')
				.where('business.id = :businessId', { businessId })
			if (expertId !== undefined) {
				query.andWhere('expert.id = :expertId', { expertId })
			}
			return await query.getOne()
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	private async getExpertWithRelations(expertId: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			return await expertRepository.findOne({
				where: { id: expertId },
				relations: [
					'user',
					'strengtheningAreas',
					'educationLevel',
					'consultorType',
					'accompaniments',
					'accompaniments.strengtheningAreas',
					'accompaniments.sessions',
					'accompaniments.sessions.status',
					'accompaniments.business',
					'accompaniments.business.user',
					'accompaniments.business.economicActivities',
					'accompaniments.business.businessSize'
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
			const sessionActivityRepository = businessDataSource.getRepository(SessionActivity)
			const preparationFilesData = await sessionPreparationFileRepository.find({ where: { sessionId } })
			const preparationFiles = preparationFilesData.map((file, index) => ({
				name: 'Archivo ' + (index + 1),
				filePath: file.filePath.startsWith('http') ? file.filePath : `${envVars.APP_URL}/${file.filePath}`
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
			const activitiesData = await sessionActivityRepository.find({
				where: { sessionId },
				relations: ['sessionActivityResponses']
			})
			const activityIds = activitiesData.map(activity => activity.id)
			const activityAttachments = await this.requestAttachmentService.findByRequestIds({
				businessName,
				requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ACTIVITY_ATTACHMENT,
				requestIds: activityIds
			})
			const activities = activitiesData.map(activity => {
				const firstAttachment = (activityAttachments[activity.id] || [])[0]
				const activityResponse = activity.sessionActivityResponses[0]
				return {
					title: activity.title,
					description: activity.description,
					requiresDeliverable: activity.requiresDeliverable,
					dueDate: this.dateService.formatDate(activity.dueDatetime),
					attachment: firstAttachment?.fileUrl ? {
						name: 'Archivo de actividad',
						filePath: firstAttachment.fileUrl
					} : null,
					respondedDate: activityResponse ? this.dateService.formatDate(activityResponse.respondedDatetime) : 'No registra.',
					deliverableDescription: activityResponse?.deliverableDescription || 'No registra.',
					deliverableAttachment: activityResponse?.deliverableFilePath ? {
						name: 'Archivo de respuesta',
						filePath: envVars.APP_URL + '/' + activityResponse.deliverableFilePath
					} : null,
					grade: activityResponse?.grade || 'No registra.'
				}
			})
			return { preparationFiles, attachments, activities }
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	private async generateSessionPdfData(session: Session, diffInHours: number, preparationFiles, attachments, generationDate, activities) {
		return this.pdfService.generateReportBySessionPdf({
			bSocialReason: session.accompaniment?.business?.socialReason || 'No registra.',
			bPhone: session.accompaniment?.business?.phone || 'No registra.',
			bEmail: session.accompaniment?.business?.email || 'No registra.',
			bEconomicActivity: session.accompaniment?.business?.economicActivities?.map(activity => activity.name).join(', ') || 'No registra.',
			bBusinessSize: session.accompaniment?.business?.businessSize?.name || 'No registra.',
			bFacebook: session.accompaniment?.business?.facebook || 'No registra.',
			bInstagram: session.accompaniment?.business?.instagram || 'No registra.',
			bTwitter: session.accompaniment?.business?.twitter || 'No registra.',
			bWebsite: session.accompaniment?.business?.website || 'No registra.',
			aStrengtheningArea: session.accompaniment?.strengtheningAreas?.map(area => area.name).join(', ') || 'No registra.',
			aTotalHours: session.accompaniment?.totalHours || 'No registra.',
			aRegisteredHours: diffInHours || 'No registra.',
			eType: session.accompaniment?.expert?.consultorType?.name || '',
			eName: session.accompaniment?.expert ? session.accompaniment.expert.firstName + ' ' + session.accompaniment.expert.lastName : 'No registra.',
			eEmail: session.accompaniment?.expert?.email || 'No registra.',
			ePhone: session.accompaniment?.expert?.phone || 'No registra.',
			eProfile: session.accompaniment?.expert?.profile || 'No registra.',
			eStrengtheningArea: session.accompaniment?.expert?.strengtheningAreas?.map(area => area.name).join(', ') || 'No registra.',
			eEducationLevel: session.accompaniment?.expert?.educationLevel?.name || 'No registra.',
			stitle: session.title || 'No registra.',
			sPreparationNotes: session.preparationNotes || 'No registra.',
			sPreparationFiles: preparationFiles,
			sSessionNotes: session.sessionNotes || 'No registra.',
			sConclusionsCommitments: session.conclusionsCommitments || 'No registra.',
			sAttachments: attachments,
			sActivities: activities,
			generationDate
		}, session.accompaniment?.business?.socialReason || 'No registra.')
	}

	private async getBusinessReportData(business: Business, generationDate: string, businessName: string) {
		const accompaniments = await Promise.all(
			business.accompaniments.map(async accompaniment => {
				let totalRegisteredHours = 0
				const sessions = await Promise.all(
					accompaniment.sessions.map(async session => {
						const { preparationFiles, attachments, activities } = await this.mapFiles(session.id, businessName)
						const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)
						if ([2, 3, 4].includes(session.statusId) && diffInHours) {
							totalRegisteredHours += diffInHours
						}
						return {
							stitle: session.title || 'No registra.',
							sPreparationNotes: session.preparationNotes || 'No registra.',
							sPreparationFiles: preparationFiles,
							sSessionNotes: session.sessionNotes || 'No registra.',
							sConclusionsCommitments: session.conclusionsCommitments || 'No registra.',
							sAttachments: attachments,
							sActivities: activities
						}
					})
				)
				const expert = accompaniment.expert
				const expertStrengtheningAreas = expert?.strengtheningAreas || []
				const accompanimentStrengtheningAreas = accompaniment.strengtheningAreas || []
				return {
					aStrengtheningArea: accompanimentStrengtheningAreas.map(area => area.name).join(', ') || 'No registra.',
					aTotalHours: accompaniment.totalHours || 'No registra.',
					aRegisteredHours: totalRegisteredHours || 'No registra.',
					eType: expert?.consultorType?.name || 'No registra.',
					eName: expert ? expert.firstName + expert.lastName : 'No registra.',
					eEmail: expert?.user?.email || 'No registra.',
					ePhone: expert?.phone || 'No registra.',
					eProfile: expert?.profile || 'No registra.',
					eStrengtheningArea: expertStrengtheningAreas.map(area => area.name).join(', ') || 'No registra.',
					eEducationLevel: expert?.educationLevel?.name || 'No registra.',
					eTotalHours: accompaniment.totalHours || 'No registra.',
					sessions
				}
			})
		)
		const businessEconomicActivities = business.economicActivities || []
		return {
			bSocialReason: business.socialReason || 'No registra.',
			bPhone: business.phone || 'No registra.',
			bEmail: business.email || 'No registra.',
			bEconomicActivity: businessEconomicActivities.map(activity => activity.name).join(', ') || 'No registra.',
			bBusinessSize: business.businessSize?.name || 'No registra.',
			bFacebook: business.facebook || 'No registra.',
			bInstagram: business.instagram || 'No registra.',
			bTwitter: business.twitter || 'No registra.',
			bWebsite: business.website || 'No registra.',
			accompaniments,
			generationDate
		}
	}

	private async getExpertReportData(expert: Expert, generationDate: string, businessName: string) {
		let eTotalHours = 0
		let eRegisteredHours = 0
		const accompaniments = await Promise.all(
			expert.accompaniments.map(async accompaniment => {
				let aTotalHours = accompaniment.totalHours
				let aRegisteredHours = 0
				const sessions = await Promise.all(
					accompaniment.sessions.map(async session => {
						const { preparationFiles, attachments, activities } = await this.mapFiles(session.id, businessName)
						const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)
						if (session.statusId === 3 && diffInHours) {
							aRegisteredHours += diffInHours
						}
						return {
							stitle: session.title || 'No registra.',
							sPreparationNotes: session.preparationNotes || 'No registra.',
							sPreparationFiles: preparationFiles,
							sSessionNotes: session.sessionNotes || 'No registra.',
							sConclusionsCommitments: session.conclusionsCommitments || 'No registra.',
							sAttachments: attachments,
							sActivities: activities
						}
					})
				)
				if(aTotalHours && aTotalHours > 0) {
					eTotalHours += aTotalHours
				}
				if(aRegisteredHours && aRegisteredHours > 0) {
					eRegisteredHours += aRegisteredHours
				}
				const business = accompaniment.business
				const businessEconomicActivities = business.economicActivities || []
				const accompanimentStrengtheningAreas = accompaniment.strengtheningAreas || []
				return {
					aStrengtheningArea: accompanimentStrengtheningAreas.map(area => area.name).join(', ') || 'No registra.',
					aTotalHours: aTotalHours || 'No registra.',
					aRegisteredHours: aRegisteredHours || 'No registra.',
					bSocialReason: business?.socialReason || 'No registra.',
					bPhone: business?.phone || 'No registra.',
					bEmail: business?.email || 'No registra.',
					bEconomicActivity: businessEconomicActivities.map(activity => activity.name).join(', ') || 'No registra.',
					bBusinessSize: business?.businessSize?.name || 'No registra.',
					bFacebook: business?.facebook || 'No registra.',
					bInstagram: business?.instagram || 'No registra.',
					bTwitter: business?.twitter || 'No registra.',
					bWebsite: business?.website || 'No registra.',
					sessions
				}
			})
		)
		const expertStrengtheningAreas = expert.strengtheningAreas || []
		return {
			eType: expert.consultorType?.name || 'No registra.',
			eName: expert.firstName + expert.lastName || 'No registra.',
			eEmail: expert.user?.email || 'No registra.',
			ePhone: expert.phone || 'No registra.',
			eProfile: expert.profile || 'No registra.',
			eStrengtheningArea: expertStrengtheningAreas.map(area => area.name).join(', ') || 'No registra.',
			eEducationLevel: expert.educationLevel?.name || 'No registra.',
			eTotalHours: eTotalHours || 'No registra.',
			eRegisteredHours: eRegisteredHours || 'No registra.',
			accompaniments,
			generationDate
		}
	}

	async create(createReportDto: CreateReportDto, businessName: string) {
		console.log('📊 ReportService.create called with:', { createReportDto, businessName })
		
		const { name, reportTypeId, sessionId, businessId, expertId } = createReportDto
		let data: any = {}

		console.log('📊 Processing report type:', reportTypeId)

		if(reportTypeId === 1) {
			console.log('📊 Processing session report for sessionId:', sessionId)
			const session = await this.getSessionWithRelations(sessionId, businessName)
			if (!session) throw new BadRequestException(`Sesión con id ${sessionId} no encontrada`)

			const { preparationFiles, attachments, activities } = await this.mapFiles(sessionId, businessName)
			const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)
			const generationDate = this.dateService.getFormattedNow()
			console.log('📊 Generating session PDF...')
			const file = await this.generateSessionPdfData(
				session,
				diffInHours,
				preparationFiles,
				attachments,
				generationDate,
				activities
			)
			data = { name, reportTypeId, sessionId, filePath: file.filePath }
		}

		if(reportTypeId === 2) {
			console.log('📊 Processing business report for businessId:', businessId)
			const business = await this.getBusinessWithRelations(businessId, businessName)
			if (!business) throw new BadRequestException(`Empresa con id ${businessId} no encontrada`)
			const generationDate = this.dateService.getFormattedNow()
			const reportData = await this.getBusinessReportData(business, generationDate, businessName)
			const attachmentPaths = await this.findApprovedSessionAttachments({ businessId }, businessName)
			console.log('📊 Generating business PDF...')
			const file = await this.pdfService.generateReportByBusinessPdf(reportData, attachmentPaths, 'business', businessName)
			data = { name, reportTypeId, businessId, filePath: file.filePath }
		}

		if(reportTypeId === 3) {
			console.log('📊 Processing business-expert report for businessId:', businessId, 'expertId:', expertId)
			const business = await this.getBusinessWithRelations(businessId, businessName, expertId)
			if (!business) throw new BadRequestException(`No se encontraron acompañamientos para la empresa con id ${businessId} y experto con id ${expertId}`)
			const generationDate = this.dateService.getFormattedNow()
			const reportData = await this.getBusinessReportData(business, generationDate, businessName)
			const attachmentPaths = await this.findApprovedSessionAttachments({ businessId, expertId }, businessName)
			console.log('📊 Generating business-expert PDF...')
			const file = await this.pdfService.generateReportByBusinessPdf(reportData, attachmentPaths, 'business-expert', businessName)
			data = { name, reportTypeId, businessId, expertId, filePath: file.filePath }
		}

		if(reportTypeId === 4) {
			console.log('📊 Processing expert report for expertId:', expertId)
			const expert = await this.getExpertWithRelations(expertId, businessName)
			if (!expert) throw new BadRequestException(`Experto con id ${expertId} no encontrado`)
			const generationDate = this.dateService.getFormattedNow()
			const reportData = await this.getExpertReportData(expert, generationDate, businessName)
			const attachmentPaths = await this.findApprovedSessionAttachments({ expertId }, businessName)
			console.log('📊 Generating expert PDF...')
			const file = await this.pdfService.generateReportByExpertPdf(reportData, attachmentPaths, businessName)
			data = { name, reportTypeId, expertId, filePath: file.filePath }
		}

		console.log('📊 Saving report to database with data:', data)
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const reportRepository = businessDataSource.getRepository(Report)
			const report = reportRepository.create(data)
			const savedReport = await reportRepository.save(report)
			console.log('📊 Report saved successfully:', savedReport)
			return savedReport
		} catch (error) {
			console.error('📊 Error saving report:', error)
			throw error
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Report>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const reportRepository = businessDataSource.getRepository(Report)
			const queryBuilder = reportRepository.createQueryBuilder('r')
				.select([
					'r.id AS id',
					'r.name AS name',
					'r.reportTypeId AS reportTypeId',
					'rt.name AS reportTypeName',
					'r.sessionId AS sessionId',
					'r.businessId AS businessId',
					'r.expertId AS expertId',
					`DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt`,
					'CONCAT(:appUrl, "/", r.file_path) AS filePath'
				])
				.innerJoin('r.reportType', 'rt')
				.orderBy('r.id', pageOptionsDto.order)
				.setParameters({appUrl: envVars.APP_URL})
				.skip(pageOptionsDto.skip)
				.take(pageOptionsDto.take)
			const [items, totalCount] = await Promise.all([
				queryBuilder.getRawMany(),
				queryBuilder.getCount()
			])
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	private normalizeNumber(value: any): number {
		const num = Number(value)
		return Number.isFinite(num) ? num : 0
	}


	private buildTotals(rows: any[]) {
		return rows.reduce((acc, row) => {
			acc.businessesCount += this.normalizeNumber(row.businessesCount)
			acc.assignedHours += this.normalizeNumber(row.assignedHours)
			acc.accompanimentsCount += this.normalizeNumber(row.accompanimentsCount)
			acc.accompanimentHours += this.normalizeNumber(row.accompanimentHours)
			acc.totalSessions += this.normalizeNumber(row.totalSessions)
			acc.completedSessions += this.normalizeNumber(row.completedSessions)
			acc.pendingSessions += this.normalizeNumber(row.pendingSessions)
			acc.totalSessionHours += this.normalizeNumber(row.totalSessionHours)
			acc.completedHours += this.normalizeNumber(row.completedHours)
			acc.pendingSessionHours += this.normalizeNumber(row.pendingSessionHours)
			acc.remainingHoursToAssign += this.normalizeNumber(row.remainingHoursToAssign)
			acc.remainingHoursToComplete += this.normalizeNumber(row.remainingHoursToComplete)
			return acc
		}, {
			businessesCount: 0,
			assignedHours: 0,
			accompanimentsCount: 0,
			accompanimentHours: 0,
			totalSessions: 0,
			completedSessions: 0,
			pendingSessions: 0,
			totalSessionHours: 0,
			completedHours: 0,
			pendingSessionHours: 0,
			remainingHoursToAssign: 0,
			remainingHoursToComplete: 0
		})
	}

	async getInstanceReport(user: JwtUser, businessName: string) {
		if (user.roleId !== 1) {
			throw new ForbiddenException('No tienes permisos para acceder a este reporte')
		}

		if (!businessName) {
			throw new BadRequestException('No se recibió la instancia actual')
		}

		return this.getBusinessReportByInstance(businessName)
	}

	private async getBusinessReportByInstance(dbName: string) {
		const adminBusinessRepository = this.adminDataSource.getRepository(AdminBusiness)
		const instance = await adminBusinessRepository.findOne({
			where: { dbName },
			select: ['id', 'name', 'dbName']
		})

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(dbName)
		if (!businessDataSource) {
			throw new BadRequestException(`No se pudo conectar a la base de datos de la instancia: ${dbName}`)
		}

		const businesses = await businessDataSource.query(`
			SELECT
				b.id AS id,
				b.social_reason AS socialReason,
				CONCAT(c.first_name, ' ', c.last_name) AS contactName,
				bs.name AS businessSize,
				b.assigned_hours AS assignedHours,
				IFNULL(acc_stats.accompanimentsCount, 0) AS accompanimentsCount,
				IFNULL(acc_stats.accompanimentHours, 0) AS accompanimentHours,
				IFNULL(sess_stats.totalSessions, 0) AS totalSessions,
				IFNULL(sess_stats.completedSessions, 0) AS completedSessions,
				IFNULL(sess_stats.totalSessionHours, 0) AS totalSessionHours,
				IFNULL(sess_stats.completedHours, 0) AS completedHours
			FROM business b
			LEFT JOIN contact_information c ON c.business_id = b.id
			LEFT JOIN business_size bs ON bs.id = b.business_size_id
			LEFT JOIN (
				SELECT
					business_id,
					COUNT(DISTINCT id) AS accompanimentsCount,
					IFNULL(SUM(total_hours), 0) AS accompanimentHours
				FROM accompaniment
				GROUP BY business_id
			) acc_stats ON acc_stats.business_id = b.id
			LEFT JOIN (
				SELECT
					a.business_id,
					COUNT(DISTINCT s.id) AS totalSessions,
					SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN 1 ELSE 0 END) AS completedSessions,
					ROUND(SUM(TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime))) AS totalSessionHours,
					ROUND(SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)) AS completedHours
				FROM accompaniment a
				LEFT JOIN session s ON s.accompaniment_id = a.id
				GROUP BY a.business_id
			) sess_stats ON sess_stats.business_id = b.id
			ORDER BY b.id
		`)

		const experts = await businessDataSource.query(`
			WITH acc_stats AS (
				SELECT
					expert_id,
					COUNT(*) AS accompanimentsCount,
					COUNT(DISTINCT business_id) AS businessesCount,
					IFNULL(SUM(total_hours), 0) AS accompanimentHours
				FROM accompaniment
				GROUP BY expert_id
			),
			sess_stats AS (
				SELECT
					a.expert_id,
					COUNT(DISTINCT s.id) AS totalSessions,
					SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN 1 ELSE 0 END) AS completedSessions,
					ROUND(SUM(TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime))) AS totalSessionHours,
					ROUND(SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)) AS completedHours
				FROM accompaniment a
				LEFT JOIN session s ON s.accompaniment_id = a.id
				GROUP BY a.expert_id
			)
			SELECT
				e.id AS id,
				CONCAT(e.first_name, ' ', e.last_name) AS expertName,
				e.email AS expertEmail,
				ct.name AS consultorType,
				IFNULL(acc_stats.accompanimentsCount, 0) AS accompanimentsCount,
				IFNULL(acc_stats.businessesCount, 0) AS businessesCount,
				IFNULL(acc_stats.accompanimentHours, 0) AS accompanimentHours,
				IFNULL(sess_stats.totalSessions, 0) AS totalSessions,
				IFNULL(sess_stats.completedSessions, 0) AS completedSessions,
				IFNULL(sess_stats.totalSessionHours, 0) AS totalSessionHours,
				IFNULL(sess_stats.completedHours, 0) AS completedHours
			FROM expert e
			LEFT JOIN consultor_type ct ON ct.id = e.consultor_type_id
			LEFT JOIN acc_stats ON acc_stats.expert_id = e.id
			LEFT JOIN sess_stats ON sess_stats.expert_id = e.id
			ORDER BY e.id
		`)

		const consultorTypes = await businessDataSource.query(`
			WITH expert_stats AS (
				SELECT
					consultor_type_id,
					COUNT(DISTINCT id) AS expertsCount
				FROM expert
				GROUP BY consultor_type_id
			),
			acc_stats AS (
				SELECT
					e.consultor_type_id,
					COUNT(DISTINCT a.id) AS accompanimentsCount,
					COUNT(DISTINCT a.business_id) AS businessesCount,
					IFNULL(SUM(a.total_hours), 0) AS accompanimentHours
				FROM accompaniment a
				LEFT JOIN expert e ON e.id = a.expert_id
				GROUP BY e.consultor_type_id
			),
			sess_stats AS (
				SELECT
					e.consultor_type_id,
					COUNT(DISTINCT s.id) AS totalSessions,
					SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN 1 ELSE 0 END) AS completedSessions,
					ROUND(SUM(TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime))) AS totalSessionHours,
					ROUND(SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)) AS completedHours
				FROM accompaniment a
				LEFT JOIN expert e ON e.id = a.expert_id
				LEFT JOIN session s ON s.accompaniment_id = a.id
				GROUP BY e.consultor_type_id
			)
			SELECT
				ct.id AS id,
				ct.name AS consultorType,
				IFNULL(expert_stats.expertsCount, 0) AS expertsCount,
				IFNULL(acc_stats.businessesCount, 0) AS businessesCount,
				IFNULL(acc_stats.accompanimentsCount, 0) AS accompanimentsCount,
				IFNULL(acc_stats.accompanimentHours, 0) AS accompanimentHours,
				IFNULL(sess_stats.totalSessions, 0) AS totalSessions,
				IFNULL(sess_stats.completedSessions, 0) AS completedSessions,
				IFNULL(sess_stats.totalSessionHours, 0) AS totalSessionHours,
				IFNULL(sess_stats.completedHours, 0) AS completedHours
			FROM consultor_type ct
			LEFT JOIN expert_stats ON expert_stats.consultor_type_id = ct.id
			LEFT JOIN acc_stats ON acc_stats.consultor_type_id = ct.id
			LEFT JOIN sess_stats ON sess_stats.consultor_type_id = ct.id
			ORDER BY ct.id
		`)

		const sessionStatuses = await businessDataSource.query(`
			SELECT
				ss.id AS id,
				ss.name AS status,
				COUNT(s.id) AS sessions,
				ROUND(IFNULL(SUM(TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime)), 0)) AS totalSessionHours
			FROM session_status ss
			LEFT JOIN session s ON s.status_id = ss.id
			GROUP BY ss.id
			ORDER BY ss.id
		`)

		const strengtheningAreas = await businessDataSource.query(`
			WITH acc_stats AS (
				SELECT
					asar.strengthening_area_id AS strengtheningAreaId,
					COUNT(DISTINCT a.id) AS accompanimentsCount,
					IFNULL(SUM(a.total_hours), 0) AS accompanimentHours
				FROM accompaniment_strengthening_area_rel asar
				INNER JOIN accompaniment a ON a.id = asar.accompaniment_id
				GROUP BY asar.strengthening_area_id
			),
			sess_stats AS (
				SELECT
					asar.strengthening_area_id AS strengtheningAreaId,
					COUNT(DISTINCT s.id) AS totalSessions,
					SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN 1 ELSE 0 END) AS completedSessions,
					ROUND(SUM(TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime))) AS totalSessionHours,
					ROUND(SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)) AS completedHours
				FROM accompaniment_strengthening_area_rel asar
				INNER JOIN accompaniment a ON a.id = asar.accompaniment_id
				LEFT JOIN session s ON s.accompaniment_id = a.id
				GROUP BY asar.strengthening_area_id
			)
			SELECT
				sa.id AS id,
				sa.name AS strengtheningArea,
				IFNULL(acc_stats.accompanimentsCount, 0) AS accompanimentsCount,
				IFNULL(acc_stats.accompanimentHours, 0) AS accompanimentHours,
				IFNULL(sess_stats.totalSessions, 0) AS totalSessions,
				IFNULL(sess_stats.completedSessions, 0) AS completedSessions,
				IFNULL(sess_stats.totalSessionHours, 0) AS totalSessionHours,
				IFNULL(sess_stats.completedHours, 0) AS completedHours
			FROM strengthening_area sa
			LEFT JOIN acc_stats ON acc_stats.strengtheningAreaId = sa.id
			LEFT JOIN sess_stats ON sess_stats.strengtheningAreaId = sa.id
			ORDER BY sa.id
		`)

		const sessionMonths = await businessDataSource.query(`
			SELECT
				DATE_FORMAT(s.start_datetime, '%Y-%m') AS month,
				COUNT(*) AS sessions,
				SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN 1 ELSE 0 END) AS completedSessions,
				ROUND(SUM(TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime))) AS totalSessionHours,
				ROUND(SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END)) AS completedHours
			FROM session s
			GROUP BY month
			ORDER BY month
		`)

		const normalizedBusinesses = businesses.map((row) => {
			const assignedHours = this.normalizeNumber(row.assignedHours)
			const accompanimentHours = this.normalizeNumber(row.accompanimentHours)
			const totalSessionHours = this.normalizeNumber(row.totalSessionHours)
			const completedHours = this.normalizeNumber(row.completedHours)
			const completedSessions = this.normalizeNumber(row.completedSessions)
			const totalSessions = this.normalizeNumber(row.totalSessions)

			const pendingSessions = Math.max(totalSessions - completedSessions, 0)
			const pendingSessionHours = Math.max(totalSessionHours - completedHours, 0)
			const remainingHoursToAssign = Math.max(assignedHours - accompanimentHours, 0)
			const remainingHoursToComplete = Math.max(assignedHours - completedHours, 0)
			const progress = assignedHours > 0 ? Math.round((completedHours / assignedHours) * 100) : 0

			return {
				...row,
				assignedHours,
				accompanimentHours,
				totalSessionHours,
				completedHours,
				totalSessions,
				completedSessions,
				pendingSessions,
				pendingSessionHours,
				remainingHoursToAssign,
				remainingHoursToComplete,
				progress
			}
		})

		const normalizedExperts = experts.map((row) => {
			const accompanimentHours = this.normalizeNumber(row.accompanimentHours)
			const totalSessionHours = this.normalizeNumber(row.totalSessionHours)
			const completedHours = this.normalizeNumber(row.completedHours)
			const totalSessions = this.normalizeNumber(row.totalSessions)
			const completedSessions = this.normalizeNumber(row.completedSessions)

			const pendingSessions = Math.max(totalSessions - completedSessions, 0)
			const pendingSessionHours = Math.max(totalSessionHours - completedHours, 0)
			const remainingHoursToComplete = Math.max(accompanimentHours - completedHours, 0)
			const progress = accompanimentHours > 0 ? Math.round((completedHours / accompanimentHours) * 100) : 0

			return {
				...row,
				accompanimentHours,
				totalSessionHours,
				completedHours,
				totalSessions,
				completedSessions,
				pendingSessions,
				pendingSessionHours,
				remainingHoursToComplete,
				progress
			}
		})

		const normalizedConsultorTypes = consultorTypes.map((row) => {
			const accompanimentHours = this.normalizeNumber(row.accompanimentHours)
			const totalSessionHours = this.normalizeNumber(row.totalSessionHours)
			const completedHours = this.normalizeNumber(row.completedHours)
			const totalSessions = this.normalizeNumber(row.totalSessions)
			const completedSessions = this.normalizeNumber(row.completedSessions)

			const pendingSessions = Math.max(totalSessions - completedSessions, 0)
			const pendingSessionHours = Math.max(totalSessionHours - completedHours, 0)
			const remainingHoursToComplete = Math.max(accompanimentHours - completedHours, 0)
			const progress = accompanimentHours > 0 ? Math.round((completedHours / accompanimentHours) * 100) : 0

			return {
				...row,
				accompanimentHours,
				totalSessionHours,
				completedHours,
				totalSessions,
				completedSessions,
				pendingSessions,
				pendingSessionHours,
				remainingHoursToComplete,
				progress
			}
		})

		const normalizedStrengtheningAreas = strengtheningAreas.map((row) => {
			const accompanimentHours = this.normalizeNumber(row.accompanimentHours)
			const totalSessionHours = this.normalizeNumber(row.totalSessionHours)
			const completedHours = this.normalizeNumber(row.completedHours)
			const totalSessions = this.normalizeNumber(row.totalSessions)
			const completedSessions = this.normalizeNumber(row.completedSessions)

			const pendingSessions = Math.max(totalSessions - completedSessions, 0)
			const pendingSessionHours = Math.max(totalSessionHours - completedHours, 0)
			const remainingHoursToComplete = Math.max(accompanimentHours - completedHours, 0)
			const progress = accompanimentHours > 0 ? Math.round((completedHours / accompanimentHours) * 100) : 0

			return {
				...row,
				accompanimentHours,
				totalSessionHours,
				completedHours,
				totalSessions,
				completedSessions,
				pendingSessions,
				pendingSessionHours,
				remainingHoursToComplete,
				progress
			}
		})

		const normalizedSessionStatuses = sessionStatuses.map((row) => {
			const sessions = this.normalizeNumber(row.sessions)
			const totalSessionHours = this.normalizeNumber(row.totalSessionHours)
			return {
				...row,
				sessions,
				totalSessionHours
			}
		})

		const normalizedSessionMonths = sessionMonths.map((row) => {
			const totalSessionHours = this.normalizeNumber(row.totalSessionHours)
			const completedHours = this.normalizeNumber(row.completedHours)
			const sessions = this.normalizeNumber(row.sessions)
			const completedSessions = this.normalizeNumber(row.completedSessions)
			const pendingSessions = Math.max(sessions - completedSessions, 0)
			const pendingSessionHours = Math.max(totalSessionHours - completedHours, 0)
			const progress = totalSessionHours > 0 ? Math.round((completedHours / totalSessionHours) * 100) : 0
			return {
				...row,
				totalSessionHours,
				completedHours,
				sessions,
				completedSessions,
				pendingSessions,
				pendingSessionHours,
				progress
			}
		})

		const totals = this.buildTotals(normalizedBusinesses)
		const progress = totals.assignedHours > 0 ? Math.round((totals.completedHours / totals.assignedHours) * 100) : 0

		return {
			instance: instance || { dbName },
			businesses: normalizedBusinesses,
			experts: normalizedExperts,
			consultorTypes: normalizedConsultorTypes,
			sessionStatuses: normalizedSessionStatuses,
			strengtheningAreas: normalizedStrengtheningAreas,
			sessionMonths: normalizedSessionMonths,
			totals: {
				...totals,
				progress
			}
		}
	}

	async remove(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const reportRepository = businessDataSource.getRepository(Report)
			const existing = await reportRepository.findOneBy({ id })
			if (!existing) return { affected: 0 }
			if (existing.filePath) {
				this.fileUploadService.deleteFile(existing.filePath)
			}
			return reportRepository.delete(id)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findApprovedSessionAttachments({ businessId, expertId }: { businessId?: number; expertId?: number }, businessName: string): Promise<string[]> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const query = sessionRepository.createQueryBuilder('session')
				.innerJoin('session.status', 'status')
				.innerJoin('session.accompaniment', 'accompaniment')
				.innerJoin('accompaniment.business', 'business')
				.where('status.id = :statusId', { statusId: 3 })
				.andWhere('session.file_path_approved IS NOT NULL')
			if (businessId !== undefined) {
				query.andWhere('business.id = :businessId', { businessId })
			}
			if (expertId !== undefined) {
				query.andWhere('accompaniment.expertId = :expertId', { expertId })
			}
			const sessions = await query
				.select('session.file_path_approved', 'filePath')
				.getRawMany()
			return sessions.map(session => session.filePath)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
