import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SessionActivityService } from './session_activity.service'
import { SessionActivityController } from './session_activity.controller'
import { SessionActivity } from 'src/entities/SessionActivity'
import { SessionActivityResponse } from 'src/entities/SessionActivityResponse'
import { Session } from 'src/entities/Session'

@Module({
	controllers: [SessionActivityController],
	providers: [SessionActivityService],
	imports: [TypeOrmModule.forFeature([SessionActivity, SessionActivityResponse, Session])]
})

export class SessionActivityModule {}
