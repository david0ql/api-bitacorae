import { Repository } from 'typeorm'
import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'

import { Platform } from 'src/entities/Platform'
import { CreatePlatformDto } from './dto/create-platform.dto'
import { FileUploadService } from 'src/services/file-upload/file-upload.service'

import envVars from 'src/config/env'

@Injectable()
export class PlatformService {
	constructor(
		@InjectRepository(Platform)
		private readonly platformRepository: Repository<Platform>,

		private readonly fileUploadService: FileUploadService
	) {}

	async create(createPlatformDto: CreatePlatformDto, files: { logoFile?: Express.Multer.File[], reportHeaderImageFile?: Express.Multer.File[] }) {
		const {
			operatorName,
			website,
			programName,
			notificationEmail,
			programStartDate
		} = createPlatformDto

		const logoPath = files.logoFile?.[0] ? this.fileUploadService.getFullPath('platform', files.logoFile[0].filename) : undefined
		const reportHeaderImagePath = files.reportHeaderImageFile?.[0] ? this.fileUploadService.getFullPath('platform', files.reportHeaderImageFile[0].filename) : undefined

		const existingPlatform = await this.platformRepository.findOne({ where: {} })

		try {
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

				return await this.platformRepository.save(existingPlatform)

			} else {
				const newPlatform = this.platformRepository.create({
					operatorName,
					website,
					programName,
					notificationEmail,
					programStartDate,
					logoPath,
					reportHeaderImagePath
				})

				return await this.platformRepository.save(newPlatform)
			}
		} catch (e) {
			if (logoPath) this.fileUploadService.deleteFile(logoPath)
			if (reportHeaderImagePath) this.fileUploadService.deleteFile(reportHeaderImagePath)
			throw e
		}
	}

	async findOne() {
		const platform = await this.platformRepository.findOne({ where: {} })
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
	}
}
