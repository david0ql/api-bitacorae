import { Injectable } from '@nestjs/common'
import { In } from 'typeorm'
import { RequestAttachment } from 'src/entities/RequestAttachment'
import { DynamicDatabaseService } from '../dynamic-database/dynamic-database.service'
import { FileUploadService } from '../file-upload/file-upload.service'
import envVars from 'src/config/env'
import { AttachmentHomologationService } from './attachment-homologation.service'
import { RequestAttachmentType } from './request-attachment.constants'

@Injectable()
export class RequestAttachmentService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly homologationService: AttachmentHomologationService
	) {}

	async ensureHomologated(businessName: string) {
		await this.homologationService.homologateIfNeeded(businessName)
	}

	private getFileUrl(filePath?: string | null, externalPath?: string | null) {
		if (externalPath) return externalPath
		if (!filePath) return null
		return filePath.startsWith('http') ? filePath : `${envVars.APP_URL}/${filePath}`
	}

	private resolveName(name: string | undefined, originalName: string, index: number, total: number) {
		const cleanName = name?.trim()
		if (total === 1 && cleanName) return cleanName
		if (cleanName) return `${cleanName} - ${originalName}`
		return originalName || `Archivo ${index + 1}`
	}

	async createAttachments(options: {
		businessName: string
		requestType: RequestAttachmentType
		requestId: number
		folder: string
		files?: Express.Multer.File[]
		name?: string
		externalPath?: string
	}) {
		const { businessName, requestType, requestId, folder, files = [], name, externalPath } = options
		await this.ensureHomologated(businessName)

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		const requestAttachmentRepository = businessDataSource.getRepository(RequestAttachment)

		const attachments: RequestAttachment[] = []
		const createdFilePaths: string[] = []

		try {
			if (files.length > 0) {
				files.forEach((file, index) => {
					const filePath = this.fileUploadService.getFullPath(folder, file.filename)
					createdFilePaths.push(filePath)
					attachments.push(
						requestAttachmentRepository.create({
							requestType,
							requestId,
							name: this.resolveName(name, file.originalname, index, files.length),
							filePath,
							externalPath: null
						})
					)
				})
			} else if (externalPath) {
				const cleanedExternal = externalPath.trim()
				const fallbackName = cleanedExternal.split('/').pop() || 'Enlace externo'
				attachments.push(
					requestAttachmentRepository.create({
						requestType,
						requestId,
						name: name?.trim() || fallbackName,
						filePath: null,
						externalPath: cleanedExternal
					})
				)
			}

			if (attachments.length === 0) return []

			const saved = await requestAttachmentRepository.save(attachments)
			return saved.map(item => ({
				...item,
				fileUrl: this.getFileUrl(item.filePath, item.externalPath)
			}))
		} catch (error) {
			createdFilePaths.forEach((path) => this.fileUploadService.deleteFile(path))
			throw error
		}
	}

	async findByRequest(options: {
		businessName: string
		requestType: RequestAttachmentType
		requestId: number
	}) {
		const { businessName, requestType, requestId } = options
		await this.ensureHomologated(businessName)

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		const requestAttachmentRepository = businessDataSource.getRepository(RequestAttachment)
		const items = await requestAttachmentRepository.find({
			where: { requestType, requestId },
			order: { id: 'ASC' }
		})

		return items.map(item => ({
			...item,
			fileUrl: this.getFileUrl(item.filePath, item.externalPath)
		}))
	}

	async findByRequestIds(options: {
		businessName: string
		requestType: RequestAttachmentType
		requestIds: number[]
	}) {
		const { businessName, requestType, requestIds } = options
		await this.ensureHomologated(businessName)

		if (!requestIds.length) return {}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		const requestAttachmentRepository = businessDataSource.getRepository(RequestAttachment)
		const items = await requestAttachmentRepository.find({
			where: { requestType, requestId: In(requestIds) },
			order: { id: 'ASC' }
		})

		const grouped = {}
		items.forEach((item) => {
			const mapped = {
				...item,
				fileUrl: this.getFileUrl(item.filePath, item.externalPath)
			}
			if (!grouped[item.requestId]) grouped[item.requestId] = []
			grouped[item.requestId].push(mapped)
		})

		return grouped
	}

	async removeById(options: { businessName: string; id: number }) {
		const { businessName, id } = options
		await this.ensureHomologated(businessName)

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		const requestAttachmentRepository = businessDataSource.getRepository(RequestAttachment)
		const existing = await requestAttachmentRepository.findOneBy({ id })
		if (!existing) return { affected: 0 }
		if (existing.filePath) this.fileUploadService.deleteFile(existing.filePath)
		return requestAttachmentRepository.delete(id)
	}
}
