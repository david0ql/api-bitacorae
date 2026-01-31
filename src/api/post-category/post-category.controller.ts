import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors } from '@nestjs/common'

import { PostCategoryService } from './post-category.service'
import { PostCategory } from 'src/entities/PostCategory'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreatePostCategoryDto } from './dto/create-post-category.dto'
import { UpdatePostCategoryDto } from './dto/update-post-category.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessCacheInterceptor } from 'src/services/cache/business-cache.interceptor'

@Controller('post-category')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(BusinessCacheInterceptor)
export class PostCategoryController {
	constructor(private readonly postCategoryService: PostCategoryService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createPostCategoryDto: CreatePostCategoryDto, @BusinessName() businessName: string) {
		return this.postCategoryService.create(createPostCategoryDto, businessName)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<PostCategory>> {
		return this.postCategoryService.findAll(pageOptionsDto, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updatePostCategoryDto: UpdatePostCategoryDto, @BusinessName() businessName: string) {
		return this.postCategoryService.update(+id, updatePostCategoryDto, businessName)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.postCategoryService.remove(+id, businessName)
	}
}
