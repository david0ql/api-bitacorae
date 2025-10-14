import { Injectable } from '@nestjs/common'

import { Platform } from 'src/entities/Platform'
import { CreatePlatformDto } from './dto/create-platform.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import envVars from 'src/config/env'

@Injectable()
export class PlatformService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService
	) {}

	async create(createPlatformDto: CreatePlatformDto, files: { logoFile?: Express.Multer.File[], reportHeaderImageFile?: Express.Multer.File[] }, businessName: string) {
		const {
			operatorName,
			website,
			programName,
			notificationEmail,
			programStartDate,
			deleteLogo,
			deleteReportHeaderImage
		} = createPlatformDto

		if (!businessName) {
			throw new Error('Se requiere especificar una empresa para crear la plataforma')
		}

		const logoPath = files.logoFile?.[0] ? this.fileUploadService.getFullPath('platform', files.logoFile[0].filename) : undefined
		const reportHeaderImagePath = files.reportHeaderImageFile?.[0] ? this.fileUploadService.getFullPath('platform', files.reportHeaderImageFile[0].filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const platformRepository = businessDataSource.getRepository(Platform)
			const existingPlatform = await platformRepository.findOne({ where: {} })

			if (existingPlatform) {
				if (logoPath) {
					if (existingPlatform.logoPath) this.fileUploadService.deleteFile(existingPlatform.logoPath)
					existingPlatform.logoPath = logoPath
				}
				if (reportHeaderImagePath) {
					if (existingPlatform.reportHeaderImagePath) this.fileUploadService.deleteFile(existingPlatform.reportHeaderImagePath)
					existingPlatform.reportHeaderImagePath = reportHeaderImagePath
				}

				existingPlatform.operatorName = operatorName
				existingPlatform.website = website || existingPlatform.website
				existingPlatform.programName = programName || existingPlatform.programName
				existingPlatform.notificationEmail = notificationEmail || existingPlatform.notificationEmail
				existingPlatform.programStartDate = programStartDate || existingPlatform.programStartDate

				if(deleteLogo && existingPlatform.logoPath) {
					this.fileUploadService.deleteFile(existingPlatform.logoPath)
					existingPlatform.logoPath = ''
				}
				if(deleteReportHeaderImage && existingPlatform.reportHeaderImagePath) {
					this.fileUploadService.deleteFile(existingPlatform.reportHeaderImagePath)
					existingPlatform.reportHeaderImagePath = ''
				}

				return await platformRepository.save(existingPlatform)

			} else {
				const newPlatform = platformRepository.create({
					operatorName,
					website,
					programName,
					notificationEmail,
					programStartDate,
					logoPath,
					reportHeaderImagePath
				})

				return await platformRepository.save(newPlatform)
			}
		} catch (e) {
			if (logoPath) this.fileUploadService.deleteFile(logoPath)
			if (reportHeaderImagePath) this.fileUploadService.deleteFile(reportHeaderImagePath)
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findOne(businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const platformRepository = businessDataSource.getRepository(Platform)
			const platform = await platformRepository.findOne({ where: {} })
			if (!platform) return {}

			return {
				id: platform.id,
				operatorName: platform.operatorName,
				logoPath: `${envVars.APP_URL}/${platform.logoPath}`,
				reportHeaderImagePath: `${envVars.APP_URL}/${platform.reportHeaderImagePath}`,
				website: platform.website,
				programName: platform.programName,
				notificationEmail: platform.notificationEmail,
				programStartDate: platform.programStartDate
			}
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
