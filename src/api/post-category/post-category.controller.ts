import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards } from '@nestjs/common'

import { PostCategoryService } from './post-category.service'
import { PostCategoryEntity } from 'src/entities/post_category.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreatePostCategoryDto } from './dto/create-post-category.dto'
import { UpdatePostCategoryDto } from './dto/update-post-category.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('post-category')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PostCategoryController {
	constructor(private readonly postCategoryService: PostCategoryService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createPostCategoryDto: CreatePostCategoryDto) {
		return this.postCategoryService.create(createPostCategoryDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<PostCategoryEntity>> {
		return this.postCategoryService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updatePostCategoryDto: UpdatePostCategoryDto) {
		return this.postCategoryService.update(+id, updatePostCategoryDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.postCategoryService.remove(+id)
	}
}
