import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { SessionService } from './session.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { SessionController } from './session.controller'
import { Session } from 'src/entities/Session'
import { Accompaniment } from 'src/entities/Accompaniment'
import { SessionPreparationFile } from 'src/entities/SessionPreparationFile'

@Module({
	controllers: [SessionController],
	providers: [SessionService, FileUploadService],
	imports: [TypeOrmModule.forFeature([Session, SessionPreparationFile,  Accompaniment])]
})

export class SessionModule {}
