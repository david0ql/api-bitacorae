import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, Query, UseGuards, UseInterceptors, UploadedFile, StreamableFile, Header } from '@nestjs/common'

import { BusinessService } from './business.service'
import { Business } from 'src/entities/Business'

import { PageDto } from 'src/dto/page.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateBusinessDto } from './dto/create-business.dto'
import { UpdateBusinessDto } from './dto/update-business.dto'

import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PermissionsGuard } from '../auth/guards/permissions.guard'
import { FileUploadInterceptor } from 'src/services/file-upload/file-upload.interceptor'
import { BusinessName } from 'src/decorators/business-name.decorator'
import { BusinessPlainName } from 'src/decorators/business-plain-name.decorator'

@Controller('business')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BusinessController {
	constructor(private readonly businessService: BusinessService) {}

	@Post()
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'business'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: CreateBusinessDto })
	create(@Body() createBusinessDto: CreateBusinessDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.businessService.create(createBusinessDto, businessName, file)
	}

	@Get()
	@HttpCode(200)
	findAll(@Query() pageOptionsDto: PageOptionsDto, @BusinessName() businessName: string, @BusinessPlainName() businessPlainName: string): Promise<PageDto<Business>> {
		return this.businessService.findAll(pageOptionsDto, businessName)
	}

	@Get('bulk-template')
	@HttpCode(200)
	@Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
	@Header('Content-Disposition', 'attachment; filename="plantilla-empresas.xlsx"')
	async downloadBulkTemplate(@BusinessName() businessName: string) {
		const buffer = await this.businessService.getBulkTemplate(businessName)
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
		return this.businessService.bulkUpload(file, businessName)
	}

	@Get('/byFilter/:filter')
	@HttpCode(200)
	findAllByFilter(@Param('filter') filter: string, @BusinessName() businessName: string) {
		return this.businessService.findAllByFilter(filter, businessName)
	}

	@Get('/byFilter')
	@HttpCode(200)
	findAllByFilterEmpty(@BusinessName() businessName: string) {
		return this.businessService.findAllByFilter('', businessName)
	}

	@Get('/name/:id')
	@HttpCode(200)
	findName(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.businessService.findName(+id, businessName)
	}

	@Get(':id')
	@HttpCode(200)
	findOne(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.businessService.findOne(+id, businessName)
	}

	@Patch(':id')
	@HttpCode(200)
	@UseInterceptors(FileUploadInterceptor('file', 'business'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: UpdateBusinessDto })
	update(@Param('id') id: string, @Body() updateBusinessDto: UpdateBusinessDto, @BusinessName() businessName: string, @UploadedFile() file?: Express.Multer.File) {
		return this.businessService.update(+id, updateBusinessDto, businessName, file)
	}

	@Delete(':id')
	@HttpCode(200)
	remove(@Param('id') id: string, @BusinessName() businessName: string) {
		return this.businessService.remove(+id, businessName)
	}
}
