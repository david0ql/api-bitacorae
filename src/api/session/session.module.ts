import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SessionService } from './session.service'
import { SessionController } from './session.controller'
import { Session } from 'src/entities/Session'
import { Accompaniment } from 'src/entities/Accompaniment'

@Module({
	controllers: [SessionController],
	providers: [SessionService],
	imports: [TypeOrmModule.forFeature([Session, Accompaniment])]
})

export class SessionModule {}
