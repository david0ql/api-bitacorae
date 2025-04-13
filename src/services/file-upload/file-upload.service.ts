import { Injectable } from '@nestjs/common'
import { diskStorage } from 'multer'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import envVars from 'src/config/env'

@Injectable()
export class FileUploadService {
	private rootPath = envVars.UPLOADS_DIR

	getMulterStorage(folder: string) {
		const destination = join(process.cwd(), this.rootPath, folder)

		if (!existsSync(destination)) {
			mkdirSync(destination, { recursive: true })
		}

		return diskStorage({
			destination,
			filename: (_, file, cb) => {
				const fileExt = file.originalname.split('.').pop()
				const filename = `${uuidv4()}.${fileExt}`
				cb(null, filename)
			}
		})
	}

	getFullPath(folder: string, filename: string) {
		return `${this.rootPath}/${folder}/${filename}`
	}

	deleteFile(filePath: string): boolean {
		const fullPath = join(process.cwd(), filePath)

		try {
			if (existsSync(fullPath)) {
				unlinkSync(fullPath)
				return true
			}
		} catch (error) {
			console.error('Error deleting file:', error)
		}

		return false
	}
}
