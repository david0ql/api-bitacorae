import { Repository } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { SessionAttachment } from 'src/entities/SessionAttachment'
import { Session } from 'src/entities/Session'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateSessionAttachmentDto } from './dto/create-session_attachment.dto'
import { UpdateSessionAttachmentDto } from './dto/update-session_attachment.dto'

@Injectable()
export class SessionAttachmentService {
	constructor(
		@InjectRepository(SessionAttachment)
		private readonly sessionAttachmentRepository: Repository<SessionAttachment>,

		@InjectRepository(SessionAttachment)
		private readonly sessionRepository: Repository<Session>,
	) {}

	create(createSessionAttachmentDto: CreateSessionAttachmentDto) {
		const { name, sessionId, externalPath } = createSessionAttachmentDto

		const session = this.sessionRepository.findOneBy({ id: sessionId })
		if (!session) {
			throw new BadRequestException(`Session with id ${sessionId} not found`)
		}

		const sessionAttachment = this.sessionAttachmentRepository.create({
			name,
			sessionId,
			externalPath
		})

		return this.sessionAttachmentRepository.save(sessionAttachment)
	}

	async findAll(sessionId: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<SessionAttachment>> {
		const queryBuilder = this.sessionAttachmentRepository.createQueryBuilder('sessionAttachment')
			.select([
				'sessionAttachment.id',
				'sessionAttachment.sessionId',
				'sessionAttachment.name',
				'sessionAttachment.filePath',
				'sessionAttachment.externalPath'
			])
			.where('sessionAttachment.sessionId = :sessionId', { sessionId })
			.orderBy('sessionAttachment.id', pageOptionsDto.order)
			.skip(pageOptionsDto.skip)
			.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
		return new PageDto(items, pageMetaDto)
	}

	async update(id: number, updateSessionAttachmentDto: UpdateSessionAttachmentDto) {
		if(!id) return { affected: 0 }

		const { name, externalPath } = updateSessionAttachmentDto

		return this.sessionAttachmentRepository.update(id, { name, externalPath })
	}

	async remove(id: number) {
		if(!id) return { affected: 0 }

		return this.sessionAttachmentRepository.delete(id)
	}
}
