import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PostService } from './post.service'
import { PostController } from './post.controller'
import { PostEntity } from 'src/entities/post.entity'
import { PostCategoryEntity } from 'src/entities/post_category.entity'

@Module({
	controllers: [PostController],
	providers: [PostService],
	imports: [TypeOrmModule.forFeature([PostEntity, PostCategoryEntity])]
})

export class PostModule {}
