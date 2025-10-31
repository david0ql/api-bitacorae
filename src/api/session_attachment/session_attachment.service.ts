import { Injectable, BadRequestException } from '@nestjs/common'
import { SessionAttachment } from 'src/entities/SessionAttachment'
import { Session } from 'src/entities/Session'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionAttachmentDto } from './dto/create-session_attachment.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'
import envVars from 'src/config/env'

@Injectable()
export class SessionAttachmentService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService
	) {}

	async create(createSessionAttachmentDto: CreateSessionAttachmentDto, file: Express.Multer.File, businessName: string) {
		const { sessionId, name, externalPath } = createSessionAttachmentDto
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const sessionAttachmentRepository = businessDataSource.getRepository(SessionAttachment)
			const filePath = file ? this.fileUploadService.getFullPath('session-attachment', file.filename) : null
			const sessionAttachment = sessionAttachmentRepository.create({
				sessionId,
				name,
				filePath,
				externalPath
			})
			const savedAttachment = await sessionAttachmentRepository.save(sessionAttachment)
			
			// Return with fileUrl for frontend compatibility
			return {
				...savedAttachment,
				fileUrl: savedAttachment.filePath ? `${envVars.APP_URL}/${savedAttachment.filePath}` : null
			}
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAll(sessionId: number, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<SessionAttachment>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const sessionAttachmentRepository = businessDataSource.getRepository(SessionAttachment)
			const queryBuilder = sessionAttachmentRepository.createQueryBuilder('sa')
				.select([
					'sa.id',
					'sa.sessionId',
					'sa.name',
					'sa.filePath',
					'sa.externalPath'
				])
				.where('sa.sessionId = :sessionId', { sessionId })
				.orderBy('sa.id', pageOptionsDto.order)
				.skip(pageOptionsDto.skip)
				.take(pageOptionsDto.take)
			const [items, totalCount] = await Promise.all([
				queryBuilder.getMany(),
				queryBuilder.getCount()
			])
			
			// Map items to include fileUrl with full URL
			const mappedItems = items.map(item => ({
				...item,
				fileUrl: item.filePath ? `${envVars.APP_URL}/${item.filePath}` : null
			}))
			
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(mappedItems, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const sessionAttachmentRepository = businessDataSource.getRepository(SessionAttachment)
			const existing = await sessionAttachmentRepository.findOneBy({ id })
			if (!existing) return { affected: 0 }
			if (existing.filePath) {
				this.fileUploadService.deleteFile(existing.filePath)
			}
			return sessionAttachmentRepository.delete(id)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
