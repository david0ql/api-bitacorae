import { BadRequestException, Injectable } from '@nestjs/common'

import { Chat } from 'src/entities/Chat'
import { ChatMessage } from 'src/entities/ChatMessage'
import { Session } from 'src/entities/Session'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { CreateChatDto } from './dto/create-chat.dto'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Injectable()
export class ChatService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async create(user: JwtUser, createChatDto: CreateChatDto, businessName: string) {
		const { sessionId, message } = createChatDto
		const { id } = user

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sessionRepository = businessDataSource.getRepository(Session)
			const chatRepository = businessDataSource.getRepository(Chat)
			const chatMessageRepository = businessDataSource.getRepository(ChatMessage)

			const session = await sessionRepository.findOne({ where: { id: sessionId } })
			if (!session) {
				throw new BadRequestException(`La sesión con id ${sessionId} no fue encontrada`)
			}

			let chat = await chatRepository.findOne({ where: { sessionId } })

			if (!chat) {
				chat = chatRepository.create({ sessionId })
				chat = await chatRepository.save(chat)
			}

			const chatMessage = chatMessageRepository.create({
				chatId: chat.id,
				senderUserId: id,
				message
			})

			return await chatMessageRepository.save(chatMessage)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async findAllBySession(id: number, pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<ChatMessage>> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const chatMessageRepository = businessDataSource.getRepository(ChatMessage)
			
			const queryBuilder = chatMessageRepository.createQueryBuilder('cm')
				.select([
					'cm.id AS id',
					'cm.message AS message',
					`DATE_FORMAT(cm.sent_at, '%Y-%m-%d %H:%i:%s') AS sentAt`,
					'user.name AS senderName',
					'user.email AS senderEmail',
					'user.roleId AS senderRoleId'
				])
				.innerJoin('cm.chat', 'chat')
				.leftJoin('cm.senderUser', 'user')
				.where('chat.sessionId = :id', { id })
				.orderBy('cm.sentAt', pageOptionsDto.order)
				.skip(pageOptionsDto.skip)
				.take(pageOptionsDto.take)

			const [items, totalCount] = await Promise.all([
				queryBuilder.getRawMany(),
				queryBuilder.getCount()
			])

			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}
}
