import { Injectable } from '@nestjs/common'
import { diskStorage } from 'multer'
import { existsSync, mkdirSync, unlinkSync } from 'fs'
import { join, parse } from 'path'
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
				const { name, ext } = parse(file.originalname)
				const timestamp = Date.now()
				const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '_') //* Sanitizing the filename
				const filename = `${safeName}-${timestamp}${ext}`
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
		} catch (e) {
			console.error('Error deleting file:', e)
		}

		return false
	}
}
