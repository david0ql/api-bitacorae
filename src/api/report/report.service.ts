import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Report } from 'src/entities/Report'
import { Business } from 'src/entities/Business'
import { Session } from 'src/entities/Session'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'
import { SessionAttachment } from 'src/entities/SessionAttachment'

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

		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,

		@InjectRepository(SessionPreparationFile)
		private readonly sessionPreparationFileRepository: Repository<SessionPreparationFile>,

		@InjectRepository(SessionAttachment)
		private readonly sessionAttachmentRepository: Repository<SessionAttachment>,

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
				'accompaniment.strengtheningArea',
				'accompaniment.business.user',
				'accompaniment.business.economicActivity',
				'accompaniment.business.businessSize',
				'accompaniment.expert.user',
				'accompaniment.expert.strengtheningArea',
				'accompaniment.expert.educationLevel',
				'accompaniment.expert.consultorType'
			]
		})
	}

	private async getBusinessWithRelations(businessId: number) {
		return this.businessRepository.findOne({
			where: { id: businessId },
			relations: [
				'user',
				'economicActivity',
				'businessSize',
				'accompaniments',
				'accompaniments.strengtheningArea',
				'accompaniments.expert.user',
				'accompaniments.expert.strengtheningArea',
				'accompaniments.expert.educationLevel',
				'accompaniments.expert.consultorType',
				'accompaniments.sessions',
				'accompaniments.sessions.status'
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

		return { preparationFiles, attachments }
	}

	private async generateSessionPdfData(session: Session, diffInHours: number, preparationFiles, attachments, generationDate) {
		return this.pdfService.generateReportBySessionPdf({
			bSocialReason: session.accompaniment?.business?.socialReason || 'No registra.',
			bPhone: session.accompaniment?.business?.phone || 'No registra.',
			bEmail: session.accompaniment?.business?.email || 'No registra.',
			bEconomicActivity: session.accompaniment?.business?.economicActivity?.name || 'No registra.',
			bBusinessSize: session.accompaniment?.business?.businessSize?.name || 'No registra.',
			bFacebook: session.accompaniment?.business?.facebook || 'No registra.',
			bInstagram: session.accompaniment?.business?.instagram || 'No registra.',
			bTwitter: session.accompaniment?.business?.twitter || 'No registra.',
			bWebsite: session.accompaniment?.business?.website || 'No registra.',
			aStrengtheningArea: session.accompaniment?.strengtheningArea?.name || 'No registra.',
			aTotalHours: session.accompaniment?.totalHours || 'No registra.',
			aRegisteredHours: diffInHours || 'No registra.',
			eType: session.accompaniment?.expert?.consultorType.name || '',
			eName: session.accompaniment?.expert ? session.accompaniment.expert.firstName + session.accompaniment.expert.lastName : 'No registra.',
			eEmail: session.accompaniment?.expert?.user?.email || 'No registra.',
			ePhone: session.accompaniment?.expert?.phone || 'No registra.',
			eProfile: session.accompaniment?.expert?.profile || 'No registra.',
			eStrengtheningArea: session.accompaniment?.expert?.strengtheningArea?.name || 'No registra.',
			eEducationLevel: session.accompaniment?.expert?.educationLevel?.name || 'No registra.',
			stitle: session.title || 'No registra.',
			sPreparationNotes: session.preparationNotes || 'No registra.',
			sPreparationFiles: preparationFiles,
			sSessionNotes: session.sessionNotes || 'No registra.',
			sConclusionsCommitments: session.conclusionsCommitments || 'No registra.',
			sAttachments: attachments,
			generationDate
		})
	}

	private async getBusinessReportData(business: Business, generationDate: string) {
		const accompaniments = await Promise.all(
			business.accompaniments.map(async accompaniment => {
				let totalRegisteredHours = 0
				let totalExpertHours = 0

				const sessions = await Promise.all(
					accompaniment.sessions.map(async session => {
						const { preparationFiles, attachments } = await this.mapFiles(session.id)

						const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)

						if (session.statusId === 3 && diffInHours) {
							totalRegisteredHours += diffInHours
						}

						if (session.statusId !== 4) {
							totalExpertHours += diffInHours
						}

						return {
							stitle: session.title || 'No registra.',
							sPreparationNotes: session.preparationNotes || 'No registra.',
							sPreparationFiles: preparationFiles,
							sSessionNotes: session.sessionNotes || 'No registra.',
							sConclusionsCommitments: session.conclusionsCommitments || 'No registra.',
							sAttachments: attachments
						}
					})
				)

				return {
					aStrengtheningArea: accompaniment.strengtheningArea?.name || 'No registra.',
					aTotalHours: accompaniment.totalHours || 'No registra.',
					aRegisteredHours: totalRegisteredHours || 'No registra.',
					eType: accompaniment.expert?.consultorType?.name || 'No registra.',
					eName: accompaniment.expert ? accompaniment.expert.firstName + accompaniment.expert.lastName : 'No registra.',
					eEmail: accompaniment.expert?.user?.email || 'No registra.',
					ePhone: accompaniment.expert?.phone || 'No registra.',
					eProfile: accompaniment.expert?.profile || 'No registra.',
					eStrengtheningArea: accompaniment.expert?.strengtheningArea?.name || 'No registra.',
					eEducationLevel: accompaniment.expert?.educationLevel?.name || 'No registra.',
					eTotalHours: totalExpertHours || 'No registra.',
					sessions
				}
			})
		)

		return {
			bSocialReason: business.socialReason || 'No registra.',
			bPhone: business.phone || 'No registra.',
			bEmail: business.email || 'No registra.',
			bEconomicActivity: business.economicActivity?.name || 'No registra.',
			bBusinessSize: business.businessSize?.name || 'No registra.',
			bFacebook: business.facebook || 'No registra.',
			bInstagram: business.instagram || 'No registra.',
			bTwitter: business.twitter || 'No registra.',
			bWebsite: business.website || 'No registra.',
			accompaniments,
			generationDate
		}
	}

	async findApprovedSessionAttachments(businessId: number): Promise<string[]> {
		const sessions = await this.sessionRepository.createQueryBuilder('session')
			.innerJoin('session.status', 'status')
			.innerJoin('session.accompaniment', 'accompaniment')
			.innerJoin('accompaniment.business', 'business')
			.where('status.id = :statusId', { statusId: 3 })
			.andWhere('business.id = :businessId', { businessId })
			.andWhere('session.file_path_approved IS NOT NULL')
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

			const { preparationFiles, attachments } = await this.mapFiles(sessionId)

			const diffInHours = this.dateService.getHoursDiff(session.startDatetime, session.endDatetime)
			const generationDate = this.dateService.getFormattedNow()

			const file = await this.generateSessionPdfData(
				session,
				diffInHours,
				preparationFiles,
				attachments,
				generationDate
			)

			data = { name, reportTypeId, sessionId, filePath: file.filePath }
		}

		if(reportTypeId === 2) {
			const business = await this.getBusinessWithRelations(businessId)
			if (!business) throw new BadRequestException(`Empresa con id ${businessId} no encontrada`)

			const generationDate = this.dateService.getFormattedNow()

			const reportData = await this.getBusinessReportData(business, generationDate)
			const attachmentPaths = await this.findApprovedSessionAttachments(businessId)

			const file = await this.pdfService.generateReportByBusinessPdf(reportData, attachmentPaths)

			data = { name, reportTypeId, businessId, filePath: file.filePath }
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
