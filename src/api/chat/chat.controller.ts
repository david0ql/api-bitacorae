import { Controller, Get, Post, Body, Param, HttpCode, Query, UseGuards } from '@nestjs/common'

import { ChatService } from './chat.service'
import { ChatMessage } from 'src/entities/ChatMessage'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateChatDto } from './dto/create-chat.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Controller('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Post()
	create(@CurrentUser() user: JwtUser, @Body() createChatDto: CreateChatDto) {
		return this.chatService.create(user, createChatDto)
	}

	@Get('/bySession/:id')
	@HttpCode(200)
	findAllBySession(@Param('id') id: string, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<ChatMessage>> {
		return this.chatService.findAllBySession(+id, pageOptionsDto)
	}
}
