import { Module } from '@nestjs/common'

import { ChatService } from './chat.service'
import { ChatController } from './chat.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [ChatController],
	providers: [ChatService],
	imports: [DynamicDatabaseModule]
})

export class ChatModule {}
