import { Module } from '@nestjs/common'

import { PostService } from './post.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DateService } from 'src/services/date/date.service'
import { PostController } from './post.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [PostController],
	providers: [PostService, FileUploadService, DateService],
	imports: [DynamicDatabaseModule]
})

export class PostModule {}
