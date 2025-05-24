import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common'

import { PostService } from './post.service'
import { Post as PostEntity } from 'src/entities/Post'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'

@Controller('post')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PostController {
	constructor(private readonly postService: PostService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'post'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreatePostDto })
	create(@Body() createPostDto: CreatePostDto, @UploadedFile() file?: Express.Multer.File) {
		return this.postService.create(createPostDto, file)
	}

	@Get()
	@HttpCode(200)
	findAll(@CurrentUser() user: JwtUser, @Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<PostEntity>> {
		return this.postService.findAll(user, pageOptionsDto)
	}

	@Get('lastPost')
	@HttpCode(200)
	findLast() {
		return this.postService.findLast()
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'post'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdatePostDto })
	update(@Param('id') id: string, @Body() updatePostDto: UpdatePostDto, @UploadedFile() file?: Express.Multer.File) {
		return this.postService.update(+id, updatePostDto, file)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.postService.remove(+id)
	}
}
