import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ChatService } from './chat.service'
import { ChatController } from './chat.controller'
import { Chat } from 'src/entities/Chat'
import { ChatMessage } from 'src/entities/ChatMessage'
import { Session } from 'src/entities/Session'

@Module({
	controllers: [ChatController],
	providers: [ChatService],
	imports: [TypeOrmModule.forFeature([Chat, ChatMessage, Session])]
})

export class ChatModule {}
