import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards } from '@nestjs/common'

import { PostService } from './post.service'
import { PostEntity } from 'src/entities/post.entity'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'

import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'

@Controller('post')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PostController {
	constructor(private readonly postService: PostService) {}

	@Post()
	@HttpCode(200)
	create(@Body() createPostDto: CreatePostDto) {
		return this.postService.create(createPostDto)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<PostEntity>> {
		return this.postService.findAll(pageOptionsDto)
	}

	@Patch(':id')
	@HttpCode(200)
	update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto) {
		return this.postService.update(+id, updatePostDto)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.postService.remove(+id)
	}
}
