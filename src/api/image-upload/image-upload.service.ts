import { BadRequestException, Injectable } from '@nestjs/common'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'

import envVars from 'src/config/env'

@Injectable()
export class ImageUploadService {
	constructor(
		private readonly fileUploadService: FileUploadService
	) {}

	async postImage(file?: Express.Multer.File) {
		if (!file) {
			throw new BadRequestException('No file uploaded')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('richText', file.filename) : undefined

		return {
			status: true,
			data: {
				url: `${envVars.APP_URL}/${fullPath}`
			}
		}
	}
}
