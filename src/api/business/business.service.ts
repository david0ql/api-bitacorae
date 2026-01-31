import { In } from 'typeorm'
import { BadRequestException, Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as ExcelJS from 'exceljs'
import { unlinkSync } from 'fs'

import { User } from 'src/entities/User'
import { Business } from 'src/entities/Business'
import { StrengtheningArea } from 'src/entities/StrengtheningArea'
import { EconomicActivity } from 'src/entities/EconomicActivity'
import { DocumentType } from 'src/entities/DocumentType'
import { Gender } from 'src/entities/Gender'
import { EducationLevel } from 'src/entities/EducationLevel'
import { BusinessSize } from 'src/entities/BusinessSize'
import { Position } from 'src/entities/Position'
import { ProductStatus } from 'src/entities/ProductStatus'
import { MarketScope } from 'src/entities/MarketScope'
import { Cohort } from 'src/entities/Cohort'
import { ContactInformation } from 'src/entities/ContactInformation'

import { PageDto } from 'src/dto/page.dto'
import { PageMetaDto } from 'src/dto/page-meta.dto'
import { PageOptionsDto } from 'src/dto/page-options.dto'
import { CreateBusinessDto } from './dto/create-business.dto'
import { UpdateBusinessDto } from './dto/update-business.dto'

import { FileUploadService } from 'src/services/file-upload/file-upload.service'
import { MailService } from 'src/services/mail/mail.service'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import envVars from 'src/config/env'

type CatalogKey =
	| 'documentTypes'
	| 'genders'
	| 'educationLevels'
	| 'economicActivities'
	| 'businessSizes'
	| 'positions'
	| 'productStatuses'
	| 'marketScopes'
	| 'cohorts'
	| 'strengtheningAreas'

type BulkColumn = {
	key: string
	required: boolean
	type: 'string' | 'number' | 'boolean' | 'numberArray'
	catalog?: CatalogKey
}

@Injectable()
export class BusinessService {
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
			{ key: 'contact_first_name', required: true, type: 'string' },
			{ key: 'contact_last_name', required: true, type: 'string' },
			{ key: 'contact_email', required: true, type: 'string' },
			{ key: 'contact_phone', required: true, type: 'string' },
			{ key: 'contact_document_type_id', required: true, type: 'number', catalog: 'documentTypes' },
			{ key: 'contact_document_number', required: true, type: 'string' },
			{ key: 'contact_gender_id', required: true, type: 'number', catalog: 'genders' },
			{ key: 'contact_experience_years', required: true, type: 'number' },
			{ key: 'contact_strengthening_area_ids', required: true, type: 'numberArray', catalog: 'strengtheningAreas' },
			{ key: 'contact_education_level_id', required: true, type: 'number', catalog: 'educationLevels' },
			{ key: 'contact_facebook', required: false, type: 'string' },
			{ key: 'contact_instagram', required: false, type: 'string' },
			{ key: 'contact_twitter', required: false, type: 'string' },
			{ key: 'contact_website', required: false, type: 'string' },
			{ key: 'contact_linkedin', required: true, type: 'string' },
			{ key: 'contact_profile', required: false, type: 'string' },
			{ key: 'business_social_reason', required: true, type: 'string' },
			{ key: 'business_document_type_id', required: true, type: 'number', catalog: 'documentTypes' },
			{ key: 'business_document_number', required: true, type: 'string' },
			{ key: 'business_address', required: true, type: 'string' },
			{ key: 'business_phone', required: true, type: 'string' },
			{ key: 'business_email', required: true, type: 'string' },
			{ key: 'business_economic_activity_ids', required: true, type: 'numberArray', catalog: 'economicActivities' },
			{ key: 'business_size_id', required: true, type: 'number', catalog: 'businessSizes' },
			{ key: 'business_number_of_employees', required: true, type: 'number' },
			{ key: 'business_last_year_sales', required: true, type: 'number' },
			{ key: 'business_two_years_ago_sales', required: true, type: 'number' },
			{ key: 'business_three_years_ago_sales', required: true, type: 'number' },
			{ key: 'business_facebook', required: false, type: 'string' },
			{ key: 'business_instagram', required: false, type: 'string' },
			{ key: 'business_twitter', required: false, type: 'string' },
			{ key: 'business_website', required: true, type: 'string' },
			{ key: 'business_linkedin', required: false, type: 'string' },
			{ key: 'business_position_id', required: true, type: 'number', catalog: 'positions' },
			{ key: 'business_has_founded_before', required: true, type: 'boolean' },
			{ key: 'business_observation', required: false, type: 'string' },
			{ key: 'business_number_of_people_leading', required: true, type: 'number' },
			{ key: 'business_product_status_id', required: true, type: 'number', catalog: 'productStatuses' },
			{ key: 'business_market_scope_id', required: true, type: 'number', catalog: 'marketScopes' },
			{ key: 'business_business_plan', required: true, type: 'string' },
			{ key: 'business_business_segmentation', required: true, type: 'string' },
			{ key: 'business_strengthening_area_ids', required: true, type: 'numberArray', catalog: 'strengtheningAreas' },
			{ key: 'business_assigned_hours', required: true, type: 'number' },
			{ key: 'business_cohort_id', required: true, type: 'number', catalog: 'cohorts' },
			{ key: 'business_diagnostic', required: true, type: 'string' },
			{ key: 'business_evidence_url', required: true, type: 'string' },
			{ key: 'business_password', required: true, type: 'string' }
		]
	}

	private async loadBulkCatalogs(dataSource: any) {
		const [
			documentTypes,
			genders,
			educationLevels,
			economicActivities,
			businessSizes,
			positions,
			productStatuses,
			marketScopes,
			cohorts,
			strengtheningAreas
		] = await Promise.all([
			dataSource.getRepository(DocumentType).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(Gender).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(EducationLevel).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(EconomicActivity).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(BusinessSize).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(Position).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(ProductStatus).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(MarketScope).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(Cohort).find({ select: { id: true, name: true }, order: { id: 'ASC' } }),
			dataSource.getRepository(StrengtheningArea).find({ select: { id: true, name: true }, order: { id: 'ASC' } })
		])

		return {
			documentTypes,
			genders,
			educationLevels,
			economicActivities,
			businessSizes,
			positions,
			productStatuses,
			marketScopes,
			cohorts,
			strengtheningAreas
		}
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

	private parseBoolean(value: string): boolean | null {
		const normalized = value.trim().toLowerCase()
		if (['true', '1', 'si', 'sí', 'yes'].includes(normalized)) return true
		if (['false', '0', 'no'].includes(normalized)) return false
		return null
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

	async create(createBusinessDto: CreateBusinessDto, businessName: string, file?: Express.Multer.File) {
		const {
			socialReason,
			documentTypeId,
			documentNumber,
			address,
			phone,
			email,
			economicActivities,
			businessSizeId,
			numberOfEmployees,
			lastYearSales,
			twoYearsAgoSales,
			threeYearsAgoSales,
			facebook,
			instagram,
			twitter,
			website,
			linkedin,
			positionId,
			hasFoundedBefore,
			observation,
			numberOfPeopleLeading,
			productStatusId,
			marketScopeId,
			businessPlan,
			businessSegmentation,
			strengtheningAreas,
			assignedHours,
			cohortId,
			diagnostic,
			password
		} = createBusinessDto

		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para crear el negocio')
		}

		const fullPath = file ? this.fileUploadService.getFullPath('business', file.filename) : undefined

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const userRepository = businessDataSource.getRepository(User)
			const economicActivityRepository = businessDataSource.getRepository(EconomicActivity)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)
			const businessRepository = businessDataSource.getRepository(Business)

			const existingUser = await userRepository.findOne({ where: { email } })

			if(existingUser) {
				if (fullPath) {
					this.fileUploadService.deleteFile(fullPath)
				}
				throw new BadRequestException('El correo electrónico ya existe')
			}

			const salt = bcrypt.genSaltSync(10)
			const hash = bcrypt.hashSync(password, salt)

			const newUser = await userRepository.save(
				userRepository.create({
					roleId: 4,
					name: socialReason,
					email,
					password: hash
				})
			)

			const economicActivityEntities = await economicActivityRepository.findBy({
				id: In(economicActivities)
			})

			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(strengtheningAreas)
			})

			const savedBusiness = await businessRepository.save(
				businessRepository.create({
					userId: newUser.id,
					socialReason,
					documentTypeId,
					documentNumber,
					address,
					phone,
					email,
					economicActivities: economicActivityEntities,
					businessSizeId,
					numberOfEmployees,
					lastYearSales,
					twoYearsAgoSales,
					threeYearsAgoSales,
					facebook,
					instagram,
					twitter,
					website,
					linkedin,
					positionId,
					hasFoundedBefore,
					observation,
					numberOfPeopleLeading,
					productStatusId,
					marketScopeId,
					businessPlan,
					businessSegmentation,
					strengtheningAreas: strengtheningAreaEntities,
					assignedHours,
					cohortId,
					diagnostic,
					evidence: fullPath
				})
			)

			try {
				this.mailService.sendWelcomeEmail({
					name: socialReason,
					email,
					password
				}, businessName)
			} catch (e) {
				console.error('Error sending welcome email:', e)
			}

			return savedBusiness
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
			contact_first_name: 'Juan',
			contact_last_name: 'Perez',
			contact_email: 'contacto@empresa.com',
			contact_phone: '3001234567',
			contact_document_type_id: catalogs.documentTypes[0]?.id ?? 1,
			contact_document_number: '123456789',
			contact_gender_id: catalogs.genders[0]?.id ?? 1,
			contact_experience_years: 3,
			contact_strengthening_area_ids: `${catalogs.strengtheningAreas[0]?.id ?? 1}`,
			contact_education_level_id: catalogs.educationLevels[0]?.id ?? 1,
			contact_linkedin: 'https://linkedin.com/in/contacto',
			contact_profile: 'Perfil del contacto',
			business_social_reason: 'Empresa Ejemplo',
			business_document_type_id: catalogs.documentTypes[0]?.id ?? 1,
			business_document_number: '900123456',
			business_address: 'Calle 1 # 2-3',
			business_phone: '3009876543',
			business_email: 'empresa@ejemplo.com',
			business_economic_activity_ids: catalogs.economicActivities.slice(0, 2).map((item) => item.id).join(','),
			business_size_id: catalogs.businessSizes[0]?.id ?? 1,
			business_number_of_employees: 10,
			business_last_year_sales: 1000000,
			business_two_years_ago_sales: 900000,
			business_three_years_ago_sales: 800000,
			business_website: 'https://empresa.com',
			business_position_id: catalogs.positions[0]?.id ?? 1,
			business_has_founded_before: 'false',
			business_number_of_people_leading: 2,
			business_product_status_id: catalogs.productStatuses[0]?.id ?? 1,
			business_market_scope_id: catalogs.marketScopes[0]?.id ?? 1,
			business_business_plan: 'Resumen del modelo de negocio',
			business_business_segmentation: 'Segmentos principales',
			business_strengthening_area_ids: `${catalogs.strengtheningAreas[0]?.id ?? 1}`,
			business_assigned_hours: 20,
			business_cohort_id: catalogs.cohorts[0]?.id ?? 1,
			business_diagnostic: 'Resultado del diagnostico',
			business_evidence_url: 'https://example.com/evidencia.pdf',
			business_password: 'Password123'
		}

		templateSheet.addRow(exampleRow)

		const tutorialSheet = workbook.addWorksheet('Tutorial')
		const tutorialLines = [
			'Mini tutorial para el cargue masivo de empresas',
			'1) Llene una fila por empresa. No cambie los nombres de las columnas.',
			'1.1) Use el archivo en formato .xlsx sin modificar la estructura.',
			'2) Las columnas con sufijo _id deben usar IDs de la hoja Catalogos.',
			'3) Las columnas con sufijo _ids aceptan multiples IDs separados por coma (ej: 1,2,3).',
			'4) business_has_founded_before debe ser true o false (tambien acepta si/no).',
			'5) business_evidence_url es obligatorio. Use una URL publica o una ruta relativa.',
			'6) business_password es obligatorio. Se enviara al correo de la empresa.',
			'7) Si hay errores, el sistema devolvera la fila y el campo a corregir.'
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
		addCatalog('Economic activities', catalogs.economicActivities)
		addCatalog('Business sizes', catalogs.businessSizes)
		addCatalog('Positions', catalogs.positions)
		addCatalog('Product statuses', catalogs.productStatuses)
		addCatalog('Market scopes', catalogs.marketScopes)
		addCatalog('Cohorts', catalogs.cohorts)
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
				economicActivities: new Set(catalogs.economicActivities.map((item) => item.id)),
				businessSizes: new Set(catalogs.businessSizes.map((item) => item.id)),
				positions: new Set(catalogs.positions.map((item) => item.id)),
				productStatuses: new Set(catalogs.productStatuses.map((item) => item.id)),
				marketScopes: new Set(catalogs.marketScopes.map((item) => item.id)),
				cohorts: new Set(catalogs.cohorts.map((item) => item.id)),
				strengtheningAreas: new Set(catalogs.strengtheningAreas.map((item) => item.id))
			}

			const existingEmails = new Set(
				(await businessDataSource.getRepository(User).find({ select: { email: true } }))
					.map((item) => item.email.toLowerCase())
			)
			const seenEmails = new Set<string>()

			const rowsToCreate: { rowIndex: number; data: Record<string, any> }[] = []
			const errors: string[] = []

			for (let rowIndex = 2; rowIndex <= sheet.rowCount; rowIndex += 1) {
				const row = sheet.getRow(rowIndex)

				const hasAnyValue = columns.some((column) => {
					const colIndex = headerMap.get(column.key) || 0
					const cellValue = this.getCellText(row.getCell(colIndex).value)
					return Boolean(cellValue)
				})

				if (!hasAnyValue) continue

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
					} else if (column.type === 'boolean') {
						const parsedBoolean = this.parseBoolean(rawValue)
						if (parsedBoolean === null) {
							rowErrors.push(`${column.key} debe ser true o false`)
						} else {
							parsed[column.key] = parsedBoolean
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

				const businessEmail = String(parsed.business_email || '').trim().toLowerCase()
				if (businessEmail) {
					if (existingEmails.has(businessEmail)) {
						rowErrors.push('business_email ya existe en la base de datos')
					}
					if (seenEmails.has(businessEmail)) {
						rowErrors.push('business_email esta duplicado en el archivo')
					}
					seenEmails.add(businessEmail)
				}

				if (rowErrors.length > 0) {
					errors.push(`Fila ${rowIndex}: ${rowErrors.join('; ')}`)
					continue
				}

				rowsToCreate.push({ rowIndex, data: parsed })
			}

			if (errors.length > 0) {
				throw new BadRequestException(errors)
			}

			const welcomeUsers: { name: string; email: string; password: string }[] = []

			await businessDataSource.transaction(async (manager) => {
				const userRepository = manager.getRepository(User)
				const businessRepository = manager.getRepository(Business)
				const contactRepository = manager.getRepository(ContactInformation)
				const economicActivityRepository = manager.getRepository(EconomicActivity)
				const strengtheningAreaRepository = manager.getRepository(StrengtheningArea)

				for (const row of rowsToCreate) {
					const data = row.data

					const salt = bcrypt.genSaltSync(10)
					const hash = bcrypt.hashSync(String(data.business_password), salt)

					const newUser = await userRepository.save(
						userRepository.create({
							roleId: 4,
							name: data.business_social_reason,
							email: data.business_email,
							password: hash
						})
					)

					const economicActivityEntities = await economicActivityRepository.findBy({
						id: In(data.business_economic_activity_ids)
					})
					const businessStrengtheningEntities = await strengtheningAreaRepository.findBy({
						id: In(data.business_strengthening_area_ids)
					})

					const savedBusiness = await businessRepository.save(
						businessRepository.create({
							userId: newUser.id,
							socialReason: data.business_social_reason,
							documentTypeId: data.business_document_type_id,
							documentNumber: data.business_document_number,
							address: data.business_address,
							phone: data.business_phone,
							email: data.business_email,
							economicActivities: economicActivityEntities,
							businessSizeId: data.business_size_id,
							numberOfEmployees: data.business_number_of_employees,
							lastYearSales: data.business_last_year_sales,
							twoYearsAgoSales: data.business_two_years_ago_sales,
							threeYearsAgoSales: data.business_three_years_ago_sales,
							facebook: data.business_facebook,
							instagram: data.business_instagram,
							twitter: data.business_twitter,
							website: data.business_website,
							linkedin: data.business_linkedin,
							positionId: data.business_position_id,
							hasFoundedBefore: data.business_has_founded_before,
							observation: data.business_observation,
							numberOfPeopleLeading: data.business_number_of_people_leading,
							productStatusId: data.business_product_status_id,
							marketScopeId: data.business_market_scope_id,
							businessPlan: data.business_business_plan,
							businessSegmentation: data.business_business_segmentation,
							strengtheningAreas: businessStrengtheningEntities,
							assignedHours: data.business_assigned_hours,
							cohortId: data.business_cohort_id,
							diagnostic: data.business_diagnostic,
							evidence: data.business_evidence_url
						})
					)

					const contactStrengtheningEntities = await strengtheningAreaRepository.findBy({
						id: In(data.contact_strengthening_area_ids)
					})

					await contactRepository.save(
						contactRepository.create({
							businessId: savedBusiness.id,
							firstName: data.contact_first_name,
							lastName: data.contact_last_name,
							email: data.contact_email,
							phone: data.contact_phone,
							documentTypeId: data.contact_document_type_id,
							documentNumber: data.contact_document_number,
							genderId: data.contact_gender_id,
							experienceYears: data.contact_experience_years,
							strengtheningAreas: contactStrengtheningEntities,
							educationLevelId: data.contact_education_level_id,
							facebook: data.contact_facebook,
							instagram: data.contact_instagram,
							twitter: data.contact_twitter,
							website: data.contact_website,
							linkedin: data.contact_linkedin,
							profile: data.contact_profile
						})
					)

					welcomeUsers.push({
						name: data.business_social_reason,
						email: data.business_email,
						password: data.business_password
					})
				}
			})

			for (const user of welcomeUsers) {
				try {
					this.mailService.sendWelcomeEmail(user, businessName)
				} catch (e) {
					console.error('Error sending welcome email:', e)
				}
			}

			return {
				created: rowsToCreate.length
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

	async findAll(pageOptionsDto: PageOptionsDto, businessName: string): Promise<PageDto<Business>> {
		const { take, skip, order } = pageOptionsDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const sql = `
				SELECT
					b.id AS id,
					b.social_reason AS socialReason,
					dt.name AS documentType,
					b.document_number AS documentNumber,
					DATE_FORMAT(b.created_at, '%Y-%m-%d %H:%i:%s') AS createdAt,
					IF(u.active = 1, 'Si', 'No') AS userActive,
					CONCAT(c.first_name, ' ', c.last_name, ' - ', b.email) AS userInfo,
					CONCAT(IFNULL(ROUND((SUM(CASE WHEN s.status_id IN (2, 3, 4) THEN TIMESTAMPDIFF(HOUR, s.start_datetime, s.end_datetime) ELSE 0 END) / b.assigned_hours) * 100, 0), 0), '%') AS progress
				FROM
					business b
					INNER JOIN user u ON u.id = b.user_id
					INNER JOIN document_type dt ON dt.id = b.document_type_id
					LEFT JOIN contact_information c ON c.business_id = b.id
					LEFT JOIN accompaniment a ON a.business_id = b.id
					LEFT JOIN session s ON s.accompaniment_id = a.id
				GROUP BY b.id
				ORDER BY b.id ${order}
				LIMIT ${take} OFFSET ${skip}
			`

			const countSql = `
				SELECT COUNT(DISTINCT b.id) AS total
				FROM business b
				INNER JOIN user u ON u.id = b.user_id
				INNER JOIN document_type dt ON dt.id = b.document_type_id
				LEFT JOIN contact_information c ON c.business_id = b.id
			`

			const [items, countResult] = await Promise.all([
				businessDataSource.query(sql),
				businessDataSource.query(countSql)
			])

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
			const businessRepository = businessDataSource.getRepository(Business)
			
			// Si el filtro está vacío o es undefined, devolver todas las empresas
			if (!filter || filter.trim() === '') {
				return await businessRepository.find({
					select: { id: true, socialReason: true },
					order: { socialReason: 'ASC' }
				})
			}

			// Usar LIKE para búsqueda parcial en lugar de coincidencia exacta
			return await businessRepository
				.createQueryBuilder('business')
				.select(['business.id', 'business.socialReason'])
				.where('business.socialReason LIKE :filter', { filter: `%${filter}%` })
				.orderBy('business.socialReason', 'ASC')
				.getMany()
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findOne(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const business = await businessRepository.findOne({
				where: { id },
				relations: ['economicActivities', 'strengtheningAreas', 'marketScope', 'productStatus']
			})

			if (!business) return null

			// Construct complete URL for evidence file
			if (business.evidence) {
				business.evidence = this.constructFileUrl(business.evidence)
			}

			return business
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async findName(id: number, businessName: string) {
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const business = await businessRepository.findOne({
				select: { id: true, socialReason: true },
				where: { id }
			})
			return {
				statusCode: 200,
				message: 'Success',
				data: business ? business.socialReason : null
			}
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}

	async update(id: number, updateBusinessDto: UpdateBusinessDto, businessName: string, file?: Express.Multer.File) {
		if (!businessName) {
			throw new BadRequestException('Se requiere especificar una empresa para actualizar el negocio')
		}

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) throw new Error(`No se pudo conectar a la base de datos de la empresa: ${businessName}`)

		try {
			const businessRepository = businessDataSource.getRepository(Business)
			const economicActivityRepository = businessDataSource.getRepository(EconomicActivity)
			const strengtheningAreaRepository = businessDataSource.getRepository(StrengtheningArea)

			const existingBusiness = await businessRepository.findOne({
				where: { id },
				relations: ['economicActivities', 'strengtheningAreas']
			})

			if (!existingBusiness) {
				throw new BadRequestException(`No se encontró un negocio con el ID ${id}`)
			}

		const fullPath = file ? this.fileUploadService.getFullPath('business', file.filename) : undefined

		// Handle the relations FIRST
		if (updateBusinessDto.economicActivities) {
			const economicActivityEntities = await economicActivityRepository.findBy({
				id: In(updateBusinessDto.economicActivities)
			})
			existingBusiness.economicActivities = economicActivityEntities
		}

		if (updateBusinessDto.strengtheningAreas) {
			const strengtheningAreaEntities = await strengtheningAreaRepository.findBy({
				id: In(updateBusinessDto.strengtheningAreas)
			})
			existingBusiness.strengtheningAreas = strengtheningAreaEntities
		}

		if (fullPath) {
			existingBusiness.evidence = fullPath
		}

		// Then assign the basic properties, excluding the relations
		const { economicActivities, strengtheningAreas, ...updateData } = updateBusinessDto
		Object.assign(existingBusiness, updateData)

		await businessRepository.save(existingBusiness)

		// Return with relations
		const updatedBusiness = await businessRepository.findOne({
			where: { id },
			relations: ['economicActivities', 'strengtheningAreas'],
			select: {
				id: true,
				userId: true,
				socialReason: true,
				documentTypeId: true,
				documentNumber: true,
				address: true,
				phone: true,
				email: true,
				businessSizeId: true,
				numberOfEmployees: true,
				lastYearSales: true,
				twoYearsAgoSales: true,
				threeYearsAgoSales: true,
				facebook: true,
				instagram: true,
				twitter: true,
				website: true,
				linkedin: true,
				positionId: true,
				hasFoundedBefore: true,
				observation: true,
				numberOfPeopleLeading: true,
				productStatusId: true,
				marketScopeId: true,
				businessPlan: true,
				businessSegmentation: true,
				assignedHours: true,
				cohortId: true,
				diagnostic: true,
				evidence: true,
				economicActivities: {
					id: true,
					name: true
				},
				strengtheningAreas: {
					id: true,
					name: true
				}
			}
		})

		// Construct complete URL for evidence file
		if (updatedBusiness?.evidence) {
			updatedBusiness.evidence = this.constructFileUrl(updatedBusiness.evidence)
		}

		return updatedBusiness
	} catch (e) {
		if (file) {
			const fullPath = this.fileUploadService.getFullPath('business', file.filename)
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
			const businessRepository = businessDataSource.getRepository(Business)

			// This is a soft delete operation - should be actually soft deleting
			// Not hard deleting. We should add "deletedAt" field to schema
			
			return await businessRepository.delete(id)
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		}
	}
}
