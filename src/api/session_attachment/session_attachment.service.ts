import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { SessionAttachment } from 'src/entities/SessionAttachment'
import { Session } from 'src/entities/Session'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionAttachmentDto } from './dto/create-session_attachment.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'

import envVars from 'src/config/env'

@Injectable()
export class SessionAttachmentService {
	constructor(
		@InjectRepository(SessionAttachment)
		private readonly sessionAttachmentRepository: Repository<SessionAttachment>,

		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,

		private readonly fileUploadService: FileUploadService
	) {}

	async create(createSessionAttachmentDto: CreateSessionAttachmentDto, file?: Express.Multer.File) {
		const { name, sessionId, externalPath } = createSessionAttachmentDto
		const fullPath = file ? this.fileUploadService.getFullPath('session-attachment', file.filename) : undefined

		const session = await this.sessionRepository.findOneBy({ id: sessionId })
		if (!session) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw new BadRequestException(`Sesión con id ${sessionId} no encontrada`)
		}

		if (!file && !externalPath) {
			throw new BadRequestException('Debe proporcionar un archivo o una ruta externa')
		}

		try {
			const sessionAttachment = this.sessionAttachmentRepository.create({
				name,
				sessionId,
				externalPath: externalPath || undefined,
				filePath: fullPath
			})

			return await this.sessionAttachmentRepository.save(sessionAttachment)

		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		}
	}

	async findAll(sessionId: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionAttachment>> {
		const queryBuilder = this.sessionAttachmentRepository.createQueryBuilder('sessionAttachment')
			.select([
				'sessionAttachment.id AS id',
				'sessionAttachment.sessionId AS sessionId',
				'sessionAttachment.name AS name',
				"CONCAT(:appUrl, '/', sessionAttachment.filePath) AS fileUrl",
				'sessionAttachment.externalPath AS externalPath'
			])
			.where('sessionAttachment.sessionId = :sessionId', { sessionId })
			.orderBy('sessionAttachment.id', pageOptionsDto.order)
			.skip(pageOptionsDto.skip)
			.take(pageOptionsDto.take)
			.setParameters({appUrl: envVars.APP_URL})

		const [items, totalCount] = await Promise.all([
			queryBuilder.getRawMany(),
			queryBuilder.getCount()
		])

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
		return new PageDto(items, pageMetaDto)
	}

	async remove(id: number) {
		const existing = await this.sessionAttachmentRepository.findOneBy({ id })
		if (!existing) return { affected: 0 }

		if (existing.filePath) {
			this.fileUploadService.deleteFile(existing.filePath)
		}

		return this.sessionAttachmentRepository.delete(id)
	}
}
