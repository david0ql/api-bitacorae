import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Report } from 'src/entities/Report'
import { Business } from 'src/entities/Business'
import { Expert } from 'src/entities/Expert'
import { Session } from 'src/entities/Session'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'
import { SessionAttachment } from 'src/entities/SessionAttachment'
import { SessionActivity } from 'src/entities/SessionActivity'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateReportDto } from './dto/create-report.dto'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DateService } from 'src/services/date/date.service'
import { PdfService } from 'src/services/pdf/pdf.service'

import envVars from 'src/config/env'

@Injectable()
export class ReportService {
	constructor(
		@InjectRepository(Report)
		private readonly reportRepository: Repository<Report>,

		@InjectRepository(Business)
		private readonly businessRepository: Repository<Business>,

		@InjectRepository(Expert)
		private readonly expertRepository: Repository<Expert>,

		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,

		@InjectRepository(SessionPreparationFile)
		private readonly sessionPreparationFileRepository: Repository<SessionPreparationFile>,

		@InjectRepository(SessionAttachment)
		private readonly sessionAttachmentRepository: Repository<SessionAttachment>,

		@InjectRepository(SessionActivity)
		private readonly sessionActivityRepository: Repository<SessionActivity>,

		private readonly fileUploadService: FileUploadService,
		private readonly dateService: DateService,
		private readonly pdfService: PdfService
	) {}

	private async getSessionWithRelations(sessionId: number) {
		return this.sessionRepository.findOne({
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
	}

	private async getBusinessWithRelations(businessId: number, expertId?: number) {
		const query = this.businessRepository.createQueryBuilder('business')
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

		return query.getOne()
	}

	private async getExpertWithRelations(expertId: number) {
		return this.expertRepository.findOne({
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
	}

	private async mapFiles(sessionId: number) {
		const preparationFilesData = await this.sessionPreparationFileRepository.find({ where: { sessionId } })
		const preparationFiles = preparationFilesData.map((file, index) => ({
			name: 'Archivo ' + (index + 1),
			filePath: envVars.APP_URL + '/' + file.filePath
		}))

		const attachmentsData = await this.sessionAttachmentRepository.find({ where: { sessionId } })
		const attachments = attachmentsData.map(file => ({
			name: file.name,
			filePath: file.externalPath ? file.externalPath : envVars.APP_URL + '/' + file.filePath
		}))

		const activitiesData = await this.sessionActivityRepository.find({
			where: { sessionId },
			relations: ['sessionActivityResponses']
		})
		const activities = activitiesData.map(activity => {
			const activityResponse = activity.sessionActivityResponses[0]

			return {
				title: activity.title,
				description: activity.description,
				requiresDeliverable: activity.requiresDeliverable,
				dueDate: this.dateService.formatDate(activity.dueDatetime),
				attachment: activity.attachmentPath ? {
					name: 'Archivo de actividad',
					filePath: envVars.APP_URL + '/' + activity.attachmentPath
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
	}

	private async generateSessionPdfData(session: Session, diffInHours: number, preparationFiles, attachments, generationDate, activities) {
		const expertStrengtheningAreas = session.accompaniment?.expert?.strengtheningAreas || []
		const businessEconomicActivities = session.accompaniment?.business?.economicActivities || []
		const accompanimentStrengtheningAreas = session.accompaniment?.strengtheningAreas || []

		return this.pdfService.generateReportBySessionPdf({
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
			eType: session.accompaniment?.expert?.consultorType.name || '',
			eName: session.accompaniment?.expert ? session.accompaniment.expert.firstName + session.accompaniment.expert.lastName : 'No registra.',
			eEmail: session.accompaniment?.expert?.user?.email || 'No registra.',
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
			sActivities: activities,
			generationDate
		})
	}

	private async getBusinessReportData(business: Business, generationDate: string) {
		const accompaniments = await Promise.all(
			business.accompaniments.map(async accompaniment => {
				let totalRegisteredHours = 0

				const sessions = await Promise.all(
					accompaniment.sessions.map(async session => {
						const { preparationFiles, attachments, activities } = await this.mapFiles(session.id)

						const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)

						if (session.statusId === 3 && diffInHours) {
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

	private async getExpertReportData(expert: Expert, generationDate: string) {
		let eTotalHours = 0
		let eRegisteredHours = 0

		const accompaniments = await Promise.all(
			expert.accompaniments.map(async accompaniment => {
				let aTotalHours = accompaniment.totalHours
				let aRegisteredHours = 0

				const sessions = await Promise.all(
					accompaniment.sessions.map(async session => {
						const { preparationFiles, attachments, activities } = await this.mapFiles(session.id)

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

	async findApprovedSessionAttachments({ businessId, expertId }: { businessId?: number; expertId?: number }): Promise<string[]> {
		const query = this.sessionRepository.createQueryBuilder('session')
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
	}

	async create(createReportDto: CreateReportDto) {
		const { name, reportTypeId, sessionId, businessId, expertId } = createReportDto
		let data:any = {}

		if(reportTypeId === 1) {
			const session = await this.getSessionWithRelations(sessionId)
			if (!session) throw new BadRequestException(`Sesión con id ${sessionId} no encontrada`)

			const { preparationFiles, attachments, activities } = await this.mapFiles(sessionId)

			const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)
			const generationDate = this.dateService.getFormattedNow()

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
			const business = await this.getBusinessWithRelations(businessId)
			if (!business) throw new BadRequestException(`Empresa con id ${businessId} no encontrada`)

			const generationDate = this.dateService.getFormattedNow()

			const reportData = await this.getBusinessReportData(business, generationDate)
			const attachmentPaths = await this.findApprovedSessionAttachments({ businessId })

			const file = await this.pdfService.generateReportByBusinessPdf(reportData, attachmentPaths)

			data = { name, reportTypeId, businessId, filePath: file.filePath }
		}

		if(reportTypeId === 3) {
			const business = await this.getBusinessWithRelations(businessId, expertId)
			if (!business) throw new BadRequestException(`No se encontraron acompañamientos para la empresa con id ${businessId} y experto con id ${expertId}`)

			const generationDate = this.dateService.getFormattedNow()

			const reportData = await this.getBusinessReportData(business, generationDate)
			const attachmentPaths = await this.findApprovedSessionAttachments({ businessId, expertId })

			const file = await this.pdfService.generateReportByBusinessPdf(reportData, attachmentPaths, 'business-expert')

			data = { name, reportTypeId, businessId, expertId, filePath: file.filePath }
		}

		if(reportTypeId === 4) {
			const expert = await this.getExpertWithRelations(expertId)
			if (!expert) throw new BadRequestException(`Experto con id ${expertId} no encontrado`)

			const generationDate = this.dateService.getFormattedNow()

			const reportData = await this.getExpertReportData(expert, generationDate)

			const attachmentPaths = await this.findApprovedSessionAttachments({ expertId })
			const file = await this.pdfService.generateReportByExpertPdf(reportData, attachmentPaths)

			data = { name, reportTypeId, expertId, filePath: file.filePath }
		}

		const report = this.reportRepository.create(data)

		return await this.reportRepository.save(report)
	}

	async findAll(pageOptionsDto: PageOptionsDto): Promise<PageDto<Report>> {
		const queryBuilder = this.reportRepository.createQueryBuilder('r')
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
	}

	async remove(id: number) {
		const existing = await this.reportRepository.findOneBy({ id })
		if (!existing) return { affected: 0 }

		if (existing.filePath) {
			this.fileUploadService.deleteFile(existing.filePath)
		}

		return this.reportRepository.delete(id)
	}
}
