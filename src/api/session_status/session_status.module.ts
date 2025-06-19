import { Module } from '@nestjs/common'

import { SessionStatusService } from './session_status.service'
import { SessionStatusController } from './session_status.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [SessionStatusController],
	providers: [SessionStatusService],
	imports: [DynamicDatabaseModule]
})

export class SessionStatusModule {}
