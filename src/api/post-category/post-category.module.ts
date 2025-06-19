import { Module } from '@nestjs/common'

import { PostCategoryService } from './post-category.service'
import { PostCategoryController } from './post-category.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [PostCategoryController],
	providers: [PostCategoryService],
	imports: [DynamicDatabaseModule]
})

export class PostCategoryModule {}
