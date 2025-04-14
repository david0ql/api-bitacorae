import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common'

import { ExpertService } from './expert.service'
import { Expert } from 'src/entities/Expert'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateExpertDto } from './dto/create-expert.dto'
import { UpdateExpertDto } from './dto/update-expert.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'

@Controller('expert')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpertController {
	constructor(private readonly expertService: ExpertService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'expert'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateExpertDto })
	create(@Body() createExpertDto: CreateExpertDto, @UploadedFile() file?: Express.Multer.File) {
		return this.expertService.create(createExpertDto, file)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto): Promise<PageDto<Expert>> {
		return this.expertService.findAll(pageOptionsDto)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string) {
		return this.expertService.findOne(+id)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'expert'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateExpertDto })
	update(@Param('id') id: string, @Body() updateExpertDto: UpdateExpertDto, @UploadedFile() file?: Express.Multer.File) {
		return this.expertService.update(+id, updateExpertDto, file)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string) {
		return this.expertService.remove(+id)
	}
}
