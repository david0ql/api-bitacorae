import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PostCategoryService } from './post-category.service'
import { PostCategoryController } from './post-category.controller'
import { PostCategory } from 'src/entities/PostCategory'

@Module({
	controllers: [PostCategoryController],
	providers: [PostCategoryService],
	imports: [TypeOrmModule.forFeature([PostCategory])]
})

export class PostCategoryModule {}
