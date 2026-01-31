import { Injectable } from '@nestjs/common'
import { RequestAttachment } from 'src/entities/RequestAttachment'
import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionAttachmentDto } from './dto/create-session_attachment.dto'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'
import envVars from 'src/config/env'
import { RequestAttachmentService } from 'src/services/request-attachment/request-attachment.service'
import { REQUEST_ATTACHMENT_TYPES } from 'src/services/request-attachment/request-attachment.constants'

@Injectable()
export class SessionAttachmentService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly requestAttachmentService: RequestAttachmentService
	) {}

	async create(createSessionAttachmentDto: CreateSessionAttachmentDto, files: Express.Multer.File[] | undefined, businessName: string) {
		const { sessionId, name, externalPath } = createSessionAttachmentDto
		return this.requestAttachmentService.createAttachments({
			businessName,
			requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT,
			requestId: sessionId,
			folder: 'session-attachment',
			files: files ?? [],
			name,
			externalPath
		})
	}

	async findAll(sessionId: number, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<RequestAttachment>> {
		await this.requestAttachmentService.ensureHomologated(businessName)
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)
		try {
			const sessionAttachmentRepository = businessDataSource.getRepository(RequestAttachment)
			const queryBuilder = sessionAttachmentRepository.createQueryBuilder('sa')
				.select([
					'sa.id',
					'sa.requestId',
					'sa.name',
					'sa.filePath',
					'sa.externalPath'
				])
				.where('sa.requestType = :requestType', { requestType: REQUEST_ATTACHMENT_TYPES.SESSION_ATTACHMENT })
				.andWhere('sa.requestId = :sessionId', { sessionId })
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
				fileUrl: item.externalPath
					? item.externalPath
					: (item.filePath ? (item.filePath.startsWith('http') ? item.filePath : `${envVars.APP_URL}/${item.filePath}`) : null),
				sessionId: item.requestId
			}))
			
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(mappedItems, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		return this.requestAttachmentService.removeById({ businessName, id })
	}
}
