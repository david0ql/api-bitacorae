import { In } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as ExcelJS from 'exceljs'
import { unlinkSync } from 'fs'

import { User } from 'src/entities/User'
import { Expert } from 'src/entities/Expert'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { DocumentType } from 'src/entities/DocumentType'
import { Gender } from 'src/entities/Gender'
import { EducationLevel } from 'src/entities/EducationLevel'
import { ConsultorType } from 'src/entities/ConsultorType'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateExpertDto } from './dto/create-expert.dto'
import { UpdateExpertDto } from './dto/update-expert.dto'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'

import envVars from 'src/config/env'
import { JwtUser } from '../auth/interfaces/jwt-user.interface'
import { createPublicBulkToken, getBusinessNameFromPublicBulkToken, getPublicBulkTokenInfo } from 'src/utils/public-bulk-token.util'

type CatalogKey =
	| 'documentTypes'
	| 'genders'
	| 'educationLevels'
	| 'consultorTypes'
	| 'strengtheningAreas'

type BulkColumn = {
	key: string
	required: boolean
	type: 'string' | 'number' | 'numberArray'
	catalog?: CatalogKey
}

type BulkRowFailure = {
	rowIndex: number
	reasons: string[]
}

@Injectable()
export class ExpertService {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly fileUploadService: FileUploadService,
		private readonly mailService: MailService
	) {}

	private constructFileUrl(filePath: string): string {
		if (!filePath) return filePath
		return filePath.startsWith('http') 
			? filePath 
			: `${envVars.APP_URL}/${filePath}`
	}

	private getBulkColumns(): BulkColumn[] {
		return [
			{ key: 'expert_first_name', required: true, type: 'string' },
			{ key: 'expert_last_name', required: true, type: 'string' },
			{ key: 'expert_email', required: true, type: 'string' },
			{ key: 'expert_phone', required: true, type: 'string' },
			{ key: 'expert_document_type_id', required: true, type: 'number', catalog: 'documentTypes' },
			{ key: 'expert_document_number', required: true, type: 'string' },
			{ key: 'expert_consultor_type_id', required: true, type: 'number', catalog: 'consultorTypes' },
			{ key: 'expert_gender_id', required: true, type: 'number', catalog: 'genders' },
			{ key: 'expert_experience_years', required: true, type: 'number' },
			{ key: 'expert_strengthening_area_ids', required: true, type: 'numberArray', catalog: 'strengtheningAreas' },
			{ key: 'expert_education_level_id', required: true, type: 'number', catalog: 'educationLevels' },
			{ key: 'expert_facebook', required: false, type: 'string' },
			{ key: 'expert_instagram', required: false, type: 'string' },
			{ key: 'expert_twitter', required: false, type: 'string' },
			{ key: 'expert_website', required: false, type: 'string' },
			{ key: 'expert_linkedin', required: true, type: 'string' },
			{ key: 'expert_profile', required: true, type: 'string' },
			{ key: 'expert_photo_url', required: false, type: 'string' },
			{ key: 'expert_password', required: true, type: 'string' }
		]
	}

	private async loadBulkCatalogs(dataSource: any) {
		const [
			documentTypes,
			genders,
			educationLevels,
			consultorTypes,
			strengtheningAreas
		] = await Promise.all([
			dataSource.getRepository(DocumentType).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(Gender).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(EducationLevel).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(ConsultorType).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(StrengtheningArea).find({ select: { id: true, name: true }, order: { id: 'ASC' } })
		])

		return {
			documentTypes,
			genders,
			educationLevels,
			consultorTypes,
			strengtheningAreas
		}
	}

	async getBulkCatalogs(businessName: string) {
		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para consultar catalogos')
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			return this.loadBulkCatalogs(businessDataSource)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	getPublicBulkLinkToken(businessName: string) {
		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para generar el enlace público')
		}

		return {
			token: createPublicBulkToken(businessName, 'expert')
		}
	}

	resolveBusinessNameFromPublicBulkToken(token: string) {
		return getBusinessNameFromPublicBulkToken(token, 'expert')
	}

	resolvePublicBulkToken(token: string) {
		return getPublicBulkTokenInfo(token, 'expert')
	}

	private getCellText(value: any): string {
		if (value === null || value === undefined) return ''
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
			return String(value).trim()
		}
		if (typeof value === 'object') {
			if (value.text) return String(value.text).trim()
			if (Array.isArray(value.richText)) {
				return value.richText.map((item: any) => item.text || '').join('').trim()
			}
			if (value.result !== undefined) return String(value.result).trim()
		}
		return String(value).trim()
	}

	private parseNumberArray(value: string): number[] {
		if (!value) return []
		const parts = value
			.split(',')
			.map((part) => part.trim())
			.filter(Boolean)
		const ids = parts.map((part) => Number(part)).filter((num) => Number.isFinite(num))
		return ids
	}

	private getBulkInsertErrorMessage(error: any): string {
		const dbErrorCode = error?.driverError?.code || error?.code
		if (dbErrorCode === 'ER_DUP_ENTRY') {
			return 'Ya existe un registro con un dato único duplicado (correo o documento).'
		}
		if (dbErrorCode === 'ER_NO_REFERENCED_ROW_2') {
			return 'Alguno de los IDs de catálogo ya no existe.'
		}
		return 'No fue posible insertar la fila por una validación de base de datos.'
	}

	async create(createExpertDto: CreateExpertDto, businessName: string, file?: Express.Multer.File) {
		const {
			firstName,
			lastName,
			email,
			phone,
			documentTypeId,
			documentNumber,
			consultorTypeId,
			genderId,
			experienceYears,
			strengtheningAreas,
			educationLevelId,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			profile,
			password
		} = createExpertDto

		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para crear el experto')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const expertRepository = businessDataSource.getRepository(Expert)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const existingUser = await userRepository.findOne({ where: { email } })
			if(existingUser) {
				if(fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException(`El correo electrónico ${email} ya existe`)
			}

			const salt = bcrypt.genSaltSync(10)
			const hash = bcrypt.hashSync(password, salt)

			const user = userRepository.create({
				roleId: 3,
				name: `${firstName} ${lastName}`,
				email,
				password: hash
			})

			const newUser = await userRepository.save(user)

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas)
			})

			const expert = expertRepository.create({
				userId: newUser.id,
				firstName,
				lastName,
				email,
				phone,
				documentTypeId,
				documentNumber,
				photo: fullPath,
				consultorTypeId,
				genderId,
				experienceYears,
				strengtheningAreas: strengtheningAreaEntities,
				educationLevelId,
				facebook,
				instagram,
				twitter,
				website,
				linkedin,
				profile
			})

			const savedExpert = await expertRepository.save(expert)

			try {
				await this.mailService.sendWelcomeEmail({
					name: `${firstName} ${lastName}`,
					email,
					password
				}, businessName)
			} catch (e) {
				console.error('Error sending welcome email:', e)
			}

			return savedExpert
		} catch (e) {
			if (fullPath) {
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async getBulkTemplate(businessName: string): Promise<Buffer> {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		const catalogs = await this.loadBulkCatalogs(businessDataSource)
		const columns = this.getBulkColumns()

		const workbook = new ExcelJS.Workbook()
		workbook.creator = 'Bitacorae'
		workbook.created = new Date()

		const templateSheet = workbook.addWorksheet('Plantilla', {
			views: [{ state: 'frozen', ySplit: 1 }]
		})
		templateSheet.columns = columns.map((column) => ({
			header: column.key,
			key: column.key,
			width: Math.max(18, column.key.length + 2)
		}))
		templateSheet.getRow(1).font = { bold: true }

		const exampleRow = {
			expert_first_name: 'Laura',
			expert_last_name: 'Gomez',
			expert_email: 'experto@ejemplo.com',
			expert_phone: '3001234567',
			expert_document_type_id: catalogs.documentTypes[0]?.id ?? 1,
			expert_document_number: '123456789',
			expert_consultor_type_id: catalogs.consultorTypes[0]?.id ?? 1,
			expert_gender_id: catalogs.genders[0]?.id ?? 1,
			expert_experience_years: 5,
			expert_strengthening_area_ids: `${catalogs.strengtheningAreas[0]?.id ?? 1}`,
			expert_education_level_id: catalogs.educationLevels[0]?.id ?? 1,
			expert_linkedin: 'https://linkedin.com/in/experto',
			expert_profile: 'Perfil profesional del experto',
			expert_photo_url: 'https://example.com/foto.jpg',
			expert_password: 'Password123'
		}

		templateSheet.addRow(exampleRow)

		const tutorialSheet = workbook.addWorksheet('Tutorial')
		const tutorialLines = [
			'Mini tutorial para el cargue masivo de expertos',
			'1) Llene una fila por experto. No cambie los nombres de las columnas.',
			'1.1) Use el archivo en formato .xlsx sin modificar la estructura.',
			'2) Las columnas con sufijo _id deben usar IDs de la hoja Catalogos.',
			'3) Las columnas con sufijo _ids aceptan multiples IDs separados por coma (ej: 1,2,3).',
			'4) expert_photo_url es opcional. Use una URL publica o una ruta relativa.',
			'5) expert_password es obligatorio. Se enviara al correo del experto.',
			'6) Si hay errores, el sistema devolvera la fila y el campo a corregir.'
		]
		tutorialLines.forEach((line) => tutorialSheet.addRow([line]))

		const catalogSheet = workbook.addWorksheet('Catalogos')
		let rowPointer = 1
		const addCatalog = (title: string, items: { id: number; name: string }[]) => {
			catalogSheet.mergeCells(`A${rowPointer}:B${rowPointer}`)
			catalogSheet.getCell(`A${rowPointer}`).value = title
			catalogSheet.getCell(`A${rowPointer}`).font = { bold: true }
			rowPointer += 1
			catalogSheet.getCell(`A${rowPointer}`).value = 'ID'
			catalogSheet.getCell(`B${rowPointer}`).value = 'NOMBRE'
			catalogSheet.getRow(rowPointer).font = { bold: true }
			rowPointer += 1
			items.forEach((item) => {
				catalogSheet.getCell(`A${rowPointer}`).value = item.id
				catalogSheet.getCell(`B${rowPointer}`).value = item.name
				rowPointer += 1
			})
			rowPointer += 2
		}

		addCatalog('Document types', catalogs.documentTypes)
		addCatalog('Genders', catalogs.genders)
		addCatalog('Education levels', catalogs.educationLevels)
		addCatalog('Consultor types', catalogs.consultorTypes)
		addCatalog('Strengthening areas', catalogs.strengtheningAreas)

		return Buffer.from(await workbook.xlsx.writeBuffer())
	}

	async bulkUpload(file: Express.Multer.File | undefined, businessName: string) {
		if (!file) {
			throw new BadRequestException('Se requiere un archivo de Excel')
		}
		const originalName = (file.originalname || '').toLowerCase()
		if (!originalName.endsWith('.xlsx')) {
			throw new BadRequestException('El archivo debe ser .xlsx')
		}
		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para el cargue masivo')
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		const filePath = file.path

		try {
			const workbook = new ExcelJS.Workbook()
			await workbook.xlsx.readFile(filePath)

			const sheet = workbook.getWorksheet('Plantilla') || workbook.worksheets[0]
			if (!sheet) {
				throw new BadRequestException('No se encontro la hoja Plantilla en el archivo')
			}

			const columns = this.getBulkColumns()
			const headerRow = sheet.getRow(1)
			const headerMap = new Map<string, number>()

			headerRow.eachCell((cell, colNumber) => {
				const header = this.getCellText(cell.value)
				if (header) headerMap.set(header, colNumber)
			})

			const missingHeaders = columns
				.filter((column) => !headerMap.has(column.key))
				.map((column) => column.key)

			if (missingHeaders.length > 0) {
				throw new BadRequestException([
					`Faltan columnas requeridas: ${missingHeaders.join(', ')}`
				])
			}

			const catalogs = await this.loadBulkCatalogs(businessDataSource)
			const catalogSets: Record<CatalogKey, Set<number>> = {
				documentTypes: new Set(catalogs.documentTypes.map((item) => item.id)),
				genders: new Set(catalogs.genders.map((item) => item.id)),
				educationLevels: new Set(catalogs.educationLevels.map((item) => item.id)),
				consultorTypes: new Set(catalogs.consultorTypes.map((item) => item.id)),
				strengtheningAreas: new Set(catalogs.strengtheningAreas.map((item) => item.id))
			}

			const existingEmails = new Set(
				(await businessDataSource.getRepository(User).find({ select: { email: true } }))
					.map((item) => item.email.toLowerCase())
			)
			const seenEmails = new Set<string>()
			const rowsToCreate: { rowIndex: number; data: Record<string, any> }[] = []
			const failedRows: BulkRowFailure[] = []
			let totalRows = 0

			for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex += 1) {
				const row = sheet.getRow(rowIndex)

				const hasAnyValue = columns.some((column) => {
					const colIndex = headerMap.get(column.key) || 0
					const cellValue = this.getCellText(row.getCell(colIndex).value)
					return Boolean(cellValue)
				})

				if (!hasAnyValue) continue
				totalRows += 1

				const rowErrors: string[] = []
				const parsed: Record<string, any> = {}

				for (const column of columns) {
					const colIndex = headerMap.get(column.key) || 0
					const rawValue = this.getCellText(row.getCell(colIndex).value)

					if (column.required && !rawValue) {
						rowErrors.push(`${column.key} es obligatorio`)
						continue
					}

					if (!rawValue) {
						parsed[column.key] = column.type === 'numberArray' ? [] : ''
						continue
					}

					if (column.type === 'number') {
						const parsedNumber = Number(rawValue)
						if (!Number.isFinite(parsedNumber)) {
							rowErrors.push(`${column.key} debe ser numerico`)
						} else {
							parsed[column.key] = parsedNumber
						}
					} else if (column.type === 'numberArray') {
						const ids = this.parseNumberArray(rawValue)
						if (column.required && ids.length === 0) {
							rowErrors.push(`${column.key} debe incluir al menos un ID`)
						} else {
							parsed[column.key] = ids
						}
					} else {
						parsed[column.key] = rawValue
					}

					if (column.catalog && parsed[column.key]) {
						const idsToCheck = Array.isArray(parsed[column.key]) ? parsed[column.key] : [parsed[column.key]]
						const invalidIds = idsToCheck.filter((id) => !catalogSets[column.catalog as CatalogKey].has(Number(id)))
						if (invalidIds.length > 0) {
							rowErrors.push(`${column.key} tiene IDs invalidos: ${invalidIds.join(', ')}`)
						}
					}
				}

				const expertEmail = String(parsed.expert_email || '').trim().toLowerCase()
				if (expertEmail) {
					if (existingEmails.has(expertEmail)) {
						rowErrors.push('expert_email ya existe en la base de datos')
					}
					if (seenEmails.has(expertEmail)) {
						rowErrors.push('expert_email esta duplicado en el archivo')
					}
				}

				if (rowErrors.length > 0) {
					failedRows.push({
						rowIndex,
						reasons: rowErrors
					})
					continue
				}

				if (expertEmail) {
					seenEmails.add(expertEmail)
				}

				rowsToCreate.push({ rowIndex, data: parsed })
			}

			const welcomeUsers: { name: string; email: string; password: string }[] = []
			let created = 0

			for (const row of rowsToCreate) {
				const data = row.data

				try {
					await businessDataSource.transaction(async (manager) => {
						const userRepository = manager.getRepository(User)
						const expertRepository = manager.getRepository(Expert)
						const strengtheningAreaRepository = manager.getRepository(StrengtheningArea)

						const salt = bcrypt.genSaltSync(10)
						const hash = bcrypt.hashSync(String(data.expert_password), salt)

						const newUser = await userRepository.save(
							userRepository.create({
								roleId: 3,
								name: `${data.expert_first_name} ${data.expert_last_name}`,
								email: data.expert_email,
								password: hash
							})
						)

						const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
							id: In(data.expert_strengthening_area_ids)
						})

						await expertRepository.save(
							expertRepository.create({
								userId: newUser.id,
								firstName: data.expert_first_name,
								lastName: data.expert_last_name,
								email: data.expert_email,
								phone: data.expert_phone,
								documentTypeId: data.expert_document_type_id,
								documentNumber: data.expert_document_number,
								photo: data.expert_photo_url || null,
								consultorTypeId: data.expert_consultor_type_id,
								genderId: data.expert_gender_id,
								experienceYears: data.expert_experience_years,
								strengtheningAreas: strengtheningAreaEntities,
								educationLevelId: data.expert_education_level_id,
								facebook: data.expert_facebook,
								instagram: data.expert_instagram,
								twitter: data.expert_twitter,
								website: data.expert_website,
								linkedin: data.expert_linkedin,
								profile: data.expert_profile
							})
						)
					})

					created += 1
					welcomeUsers.push({
						name: `${data.expert_first_name} ${data.expert_last_name}`,
						email: data.expert_email,
						password: data.expert_password
					})
				} catch (e) {
					console.error(`Error inserting expert row ${row.rowIndex}:`, e)
					failedRows.push({
						rowIndex: row.rowIndex,
						reasons: [this.getBulkInsertErrorMessage(e)]
					})
				}
			}

			for (const user of welcomeUsers) {
				try {
					await this.mailService.sendWelcomeEmail(user, businessName)
				} catch (e) {
					console.error('Error sending welcome email:', e)
				}
			}

			return {
				totalRows,
				created,
				failed: failedRows.length,
				failedRows
			}
		} finally {
			if (filePath) {
				try {
					unlinkSync(filePath)
				} catch (e) {
					console.error('Error deleting bulk file:', e)
				}
			}
		}
	}

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<any>> {
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					e.id AS id,
					e.user_id AS userId,
					e.first_name AS firstName,
					e.last_name AS lastName,
					e.email AS email,
					e.phone AS phone,
					e.document_type_id AS documentTypeId,
					dt.name AS documentTypeName,
					e.document_number AS documentNumber,
					CASE
						WHEN e.photo IS NULL OR e.photo = '' THEN NULL
						WHEN e.photo LIKE 'http%' THEN e.photo
						ELSE CONCAT(?, '/', e.photo)
					END AS photo,
					e.consultor_type_id AS consultorTypeId,
					ct.name AS consultorTypeName,
					e.gender_id AS genderId,
					e.experience_years AS experienceYears,
					e.education_level_id AS educationLevelId,
					e.facebook AS facebook,
					e.instagram AS instagram,
					e.twitter AS twitter,
					e.website AS website,
					e.linkedin AS linkedin,
					e.profile AS profile,
					u.active AS active,
					u.created_at AS createdAt,
					IF(u.active = 1, 'Si', 'No') AS userActive,
					IF(COUNT(sa.id) > 0,
						CONCAT('[',
							GROUP_CONCAT(DISTINCT JSON_OBJECT(
								'value', sa.id,
								'label', sa.name
							)),
						']'),
						NULL
					) AS strengtheningAreas
				FROM expert e
				INNER JOIN user u ON u.id = e.user_id
				INNER JOIN consultor_type ct ON ct.id = e.consultor_type_id
				LEFT JOIN document_type dt ON dt.id = e.document_type_id
				LEFT JOIN expert_strengthening_area_rel esa ON esa.expert_id = e.id
				LEFT JOIN strengthening_area sa ON sa.id = esa.strengthening_area_id
				GROUP BY e.id
				ORDER BY e.id ${order}
				LIMIT ${skip}, ${take}
			`

			const countSql = `
				SELECT COUNT(DISTINCT e.id) AS total
				FROM expert e
			`

			const [rawItems, countResult] = await Promise.all([
				businessDataSource.query(sql, [envVars.APP_URL]),
				businessDataSource.query(countSql)
			])

			const items = rawItems.map(item => {
				const strengtheningAreas = item.strengtheningAreas ? JSON.parse(item.strengtheningAreas) : []
				return { ...item, strengtheningAreas }
			})

			const totalCount = Number(countResult[0]?.total) ?? 0
			const pageMetaDto = new PageMetaDto({ pageOptionsDto, totalCount })
			return new PageDto(items, pageMetaDto)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAllByFilter(filter: string, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			
			// If filter is empty or undefined, return all experts
			if (!filter || filter.trim() === '') {
				const result = await expertRepository
					.createQueryBuilder('e')
					.select(['e.id', 'e.firstName', 'e.lastName'])
					.getMany()
				return result
			}
			
			// Otherwise, filter by name
			const result = await expertRepository
				.createQueryBuilder('e')
				.select(['e.id', 'e.firstName', 'e.lastName'])
				.where('e.firstName LIKE :filter OR e.lastName LIKE :filter', { filter: `%${filter}%` })
				.getMany()
			return result
		} catch (error) {
			throw error
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAllByAccompaniment(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					e.id AS id,
					e.first_name AS firstName,
					e.last_name AS lastName,
					e.email AS email,
					e.phone AS phone,
					CASE
						WHEN e.photo IS NULL OR e.photo = '' THEN NULL
						WHEN e.photo LIKE 'http%' THEN e.photo
						ELSE CONCAT(?, '/', e.photo)
					END AS photo,
					ct.name AS consultorTypeName,
					e.experience_years AS experienceYears,
					IF(COUNT(sa.id) > 0,
						CONCAT('[',
							GROUP_CONCAT(DISTINCT JSON_OBJECT(
								'value', sa.id,
								'label', sa.name
							)),
						']'),
						NULL
					) AS strengtheningAreas
				FROM expert e
				INNER JOIN consultor_type ct ON ct.id = e.consultor_type_id
				LEFT JOIN expert_strengthening_area_rel esa ON esa.expert_id = e.id
				LEFT JOIN strengthening_area sa ON sa.id = esa.strengthening_area_id
				WHERE e.id = ?
				GROUP BY e.id
			`

			const [expert] = await businessDataSource.query(sql, [envVars.APP_URL, id])

			if (!expert) return {}

			return {
				...expert,
				strengtheningAreas: expert.strengtheningAreas ? JSON.parse(expert.strengtheningAreas) : []
			}
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findOne(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			const expert = await expertRepository.findOne({
				select: {
					id: true,
					userId: true,
					firstName: true,
					lastName: true,
					email: true,
					phone: true,
					documentTypeId: true,
					documentNumber: true,
					photo: true,
					consultorTypeId: true,
					genderId: true,
					experienceYears: true,
					educationLevelId: true,
					facebook: true,
					instagram: true,
					twitter: true,
					website: true,
					linkedin: true,
					profile: true,
					documentType: {
						id: true,
						name: true
					},
					consultorType: {
						id: true,
						name: true
					},
					gender: {
						id: true,
						name: true
					},
					educationLevel: {
						id: true,
						name: true
					},
					strengtheningAreas: {
						id: true,
						name: true
					}
				},
				where: { id },
				relations: ['documentType', 'consultorType', 'gender', 'educationLevel', 'strengtheningAreas']
			})

			if (!expert) return null

			// Construct complete URL for photo
			if (expert.photo) {
				expert.photo = this.constructFileUrl(expert.photo)
			}

			return expert
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateExpertDto: UpdateExpertDto, businessName: string, file?: Express.Multer.File) {
		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para actualizar el experto')
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const existingExpert = await expertRepository.findOne({
				where: { id },
				relations: ['strengtheningAreas']
			})

			if (!existingExpert) {
				throw new BadRequestException(`No se encontró un experto con el ID ${id}`)
			}

			const fullPath = file ? this.fileUploadService.getFullPath('user', file.filename) : undefined

		if (updateExpertDto.strengtheningAreas) {
			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(updateExpertDto.strengtheningAreas)
			})
			existingExpert.strengtheningAreas = strengtheningAreaEntities
		}

		if (fullPath) {
			existingExpert.photo = fullPath
		}

		// Remover strengtheningAreas del DTO antes de hacer Object.assign
		// porque ya las asignamos manualmente como entidades
		const { strengtheningAreas, ...updateData } = updateExpertDto
		Object.assign(existingExpert, updateData)

		await expertRepository.save(existingExpert)

		// Volver a consultar para obtener las relaciones
		const updatedExpert = await expertRepository.findOne({
			where: { id },
			relations: ['strengtheningAreas'],
			select: {
				id: true,
				userId: true,
				firstName: true,
				lastName: true,
				email: true,
				phone: true,
				documentTypeId: true,
				documentNumber: true,
				photo: true,
				consultorTypeId: true,
				genderId: true,
				experienceYears: true,
				educationLevelId: true,
				facebook: true,
				instagram: true,
				twitter: true,
				website: true,
				linkedin: true,
				profile: true,
				strengtheningAreas: {
					id: true,
					name: true
				}
			}
		})

		// Construct complete URL for photo
		if (updatedExpert?.photo) {
			updatedExpert.photo = this.constructFileUrl(updatedExpert.photo)
		}

		return updatedExpert
		} catch (e) {
			if (file) {
				const fullPath = this.fileUploadService.getFullPath('user', file.filename)
				this.fileUploadService.deleteFile(fullPath)
			}
			throw e
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async remove(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			return await expertRepository.delete(id)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findAllForBusiness(user: JwtUser, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const expertRepository = businessDataSource.getRepository(Expert)
			return await expertRepository.find({
				relations: ['user']
			})
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
