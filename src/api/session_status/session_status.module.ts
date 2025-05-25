import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SessionStatusService } from './session_status.service'
import { SessionStatusController } from './session_status.controller'
import { SessionStatus } from 'src/entities/SessionStatus'

@Module({
	controllers: [SessionStatusController],
	providers: [SessionStatusService],
	imports: [TypeOrmModule.forFeature([SessionStatus])]
})

export class SessionStatusModule {}
