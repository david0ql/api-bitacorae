import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'

import { Chat } from 'src/entities/Chat'
import { ChatMessage } from 'src/entities/ChatMessage'
import { Session } from 'src/entities/Session'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { CreateChatDto } from './dto/create-chat.dto'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Injectable()
export class ChatService {
	constructor(
		@InjectRepository(Chat)
		private readonly chatRepository: Repository<Chat>,

		@InjectRepository(ChatMessage)
		private readonly chatMessageRepository: Repository<ChatMessage>,

		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>
	) {}

	async create(user: JwtUser, createChatDto: CreateChatDto) {
		const { sessionId, message } = createChatDto
		const { id } = user

		const session = await this.sessionRepository.findOne({ where: { id: sessionId } })
		if (!session) {
			throw new BadRequestException(`Session with id ${sessionId} not found`)
		}

		let chat = await this.chatRepository.findOne({ where: { sessionId } })

		if (!chat) {
			chat = this.chatRepository.create({ sessionId })
			chat = await this.chatRepository.save(chat)
		}

		const chatMessage = this.chatMessageRepository.create({
			chatId: chat.id,
			senderUserId: id,
			message
		})

		return this.chatMessageRepository.save(chatMessage)
	}

	async findAllBySession(id: number, pageOptionsDto: PageOptionsDto): Promise<PageDto<ChatMessage>> {
		const queryBuilder = this.chatMessageRepository.createQueryBuilder('chat_message')
			.leftJoin('chat_message.senderUser', 'user')
			.select([
				'chat_message.id',
				'chat_message.message',
				'chat_message.sentAt',
				'user.name',
				'user.email',
				'user.roleId'
			])
			.where('chat_message.chatId = :id', { id })
			.orderBy('chat_message.sentAt', pageOptionsDto.order)
			.skip(pageOptionsDto.skip)
			.take(pageOptionsDto.take)

		const [ items, totalCount ] = await queryBuilder.getManyAndCount()

		const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })

		return new PageDto(items, pageMetaDto)
	}
}
