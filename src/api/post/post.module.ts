import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PostService } from './post.service'
import { PostController } from './post.controller'
import { Post } from 'src/entities/Post'
import { PostCategory } from 'src/entities/PostCategory'

@Module({
	controllers: [PostController],
	providers: [PostService],
	imports: [TypeOrmModule.forFeature([Post, PostCategory])]
})

export class PostModule {}
