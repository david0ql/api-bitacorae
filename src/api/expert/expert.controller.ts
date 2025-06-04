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
import { JwtUser } from '../auth/interfaces/jwt-user.interface'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('expert')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpertController {
	constructor(private readonly expertService: ExpertService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'user'))
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

	@Get('/forBusiness')
	@HttpCode(200)
	findAllForBusiness(@CurrentUser() user: JwtUser) {
		return this.expertService.findAllForBusiness(user)
	}

	@Get('/byFilter/:filter')
	@HttpCode(200)
	findAllByFilter(@Param('filter') filter: string) {
		return this.expertService.findAllByFilter(filter)
	}

	@Get('/byAccompaniment/:id')
	@HttpCode(200)
	findAllByAccompaniment(@Param('id') id: string) {
		return this.expertService.findAllByAccompaniment(+id)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string) {
		return this.expertService.findOne(+id)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'user'))
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
