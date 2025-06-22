import { Controller, Get, Post, Body, Patch, Param, UseGuards, HttpCode, UseInterceptors, UploadedFile, Delete, Query } from '@nestjs/common'

import { AuditorService } from './auditor.service'

import { CreateAuditorDto } from './dto/create-auditor.dto'
import { UpdateAuditorDto } from './dto/update-auditor.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { PageDto } from 'src/dto/page.dto'
import { Auditor } from 'src/entities/Auditor'
import { BusinessName } from 'src/decorators/business-name.decorator'

@Controller('auditor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditorController {
	constructor(private readonly auditorService: AuditorService) { }

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'auditor'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateAuditorDto })
	create(@Body() createAuditorDto: CreateAuditorDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.auditorService.create(createAuditorDto, businessName, file)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Auditor>> {
		return this.auditorService.findAll(pageOptionsDto, businessName)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.auditorService.findOne(+id, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'auditor'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateAuditorDto })
	update(@Param('id') id: string, @Body() updateAuditorDto: UpdateAuditorDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.auditorService.update(+id, updateAuditorDto, businessName, file)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.auditorService.remove(+id, businessName)
	}
}
