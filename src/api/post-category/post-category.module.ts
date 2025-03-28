import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { PostCategoryService } from './post-category.service'
import { PostCategoryController } from './post-category.controller'
import { PostCategoryEntity } from 'src/entities/post_category.entity'

@Module({
	controllers: [PostCategoryController],
	providers: [PostCategoryService],
	imports: [TypeOrmModule.forFeature([PostCategoryEntity])]
})

export class PostCategoryModule {}
