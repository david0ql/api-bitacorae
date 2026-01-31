import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors, UploadedFile, StreamableFile, Header } from '@nestjs/common'

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
import { BusinessName } from 'src/decorators/business-name.decorator'

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
	create(@Body() createExpertDto: CreateExpertDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.expertService.create(createExpertDto, businessName, file)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string): Promise<PageDto<Expert>> {
		return this.expertService.findAll(pageOptionsDto, businessName)
	}

	@Get('bulk-template')
	@HttpCode(200)
	@Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
	@Header('Content-Disposition', 'attachment; filename="plantilla-expertos.xlsx"')
	async downloadBulkTemplate(@BusinessName() businessName: string) {
		const buffer = await this.expertService.getBulkTemplate(businessName)
		return new StreamableFile(buffer)
	}

	@Post('bulk-upload')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'imports'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' }
			}
		}
	})
	bulkUpload(@BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.expertService.bulkUpload(file, businessName)
	}

	@Get('/forBusiness')
	@HttpCode(200)
	findAllForBusiness(@CurrentUser() user: JwtUser, @BusinessName() businessName: string) {
		return this.expertService.findAllForBusiness(user, businessName)
	}

	@Get('/byFilter')
	@HttpCode(200)
	findAllByFilterEmpty(@BusinessName() businessName: string) {
		return this.expertService.findAllByFilter('', businessName)
	}

	@Get('/byFilter/:filter')
	@HttpCode(200)
	findAllByFilter(@Param('filter') filter: string, @BusinessName() businessName: string) {
		// Handle empty filter parameter
		if (!filter || filter.trim() === '') {
			return []
		}
		
		return this.expertService.findAllByFilter(filter, businessName)
	}

	@Get('/byAccompaniment/:id')
	@HttpCode(200)
	findAllByAccompaniment(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.expertService.findAllByAccompaniment(+id, businessName)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string, @BusinessName() businessName: string) {
		const numericId = +id
		if (isNaN(numericId)) {
			throw new Error('Invalid expert ID')
		}
		
		return this.expertService.findOne(numericId, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'user'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateExpertDto })
	update(@Param('id') id: string, @Body() updateExpertDto: UpdateExpertDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.expertService.update(+id, updateExpertDto, businessName, file)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.expertService.remove(+id, businessName)
	}
}
