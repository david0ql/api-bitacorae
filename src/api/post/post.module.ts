import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PostService } from './post.service'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { PostController } from './post.controller'
import { Post } from 'src/entities/Post'
import { PostCategory } from 'src/entities/PostCategory'

@Module({
	controllers: [PostController],
	providers: [PostService, FileUploadService],
	imports: [TypeOrmModule.forFeature([Post, PostCategory])]
})

export class PostModule {}
