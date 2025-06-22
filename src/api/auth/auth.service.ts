import { Repository } from 'typeorm'
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { AuthDto } from './dto/user.dto'
import { BusinessAuthDto } from './dto/business-auth.dto'
import { User } from 'src/entities/User'
import { Business } from 'src/entities/admin/Business'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from './interfaces/jwt-payload.interface'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'
import envVars from 'src/config/env'

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(Business, envVars.DB_ALIAS_ADMIN)
		private readonly businessRepository: Repository<Business>,
		private readonly jwtService: JwtService,
		private readonly dynamicDbService: DynamicDatabaseService
	) {}

	async login(authDto: AuthDto, businessName: string) {
		const { email, password } = authDto

		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		if (!businessDataSource) {
			throw new NotFoundException('No se pudo conectar a la base de datos de la empresa')
		}

		try {
			const userRepository = businessDataSource.getRepository(User)
			const user = await userRepository.findOne({
				where: { email },
				select: { id: true, roleId: true, password: true, email: true, active: true }
			})

			if (!user) throw new NotFoundException('Usuario no encontrado')
			if (!user.active) throw new UnauthorizedException('El usuario está inactivo')
			if (!bcrypt.compareSync(password, user.password)) throw new NotFoundException('Credenciales inválidas')

			const payload = { id: user.id, roleId: user.roleId, email, businessName }

			return {
				token: this.generateToken(payload),
				user: { id: user.id, email: user.email, roleId: user.roleId }
			}
		} finally {
			await this.dynamicDbService.closeBusinessConnection(businessDataSource)
		}
	}

	async businessLogin(businessAuthDto: BusinessAuthDto) {
		const { companyId, companyPassword } = businessAuthDto

		// Buscar la empresa en la base de datos admin por username o name
		const business = await this.businessRepository.findOne({
			where: [
				{ username: companyId },
				{ name: companyId }
			],
			select: { 
				id: true, 
				username: true,
				name: true,
				password: true,
				dbName: true
			}
		})

		if (!business) throw new NotFoundException('Empresa no encontrada')
		if (!bcrypt.compareSync(companyPassword, business.password)) throw new NotFoundException('Credenciales inválidas')

		return {
			success: true,
			business: { 
				id: business.id, 
				username: business.username,
				name: business.name,
				dbName: business.dbName
			}
		}
	}

	async syncDatabase(dbName: string) {
		try {
			// Buscar la empresa en la base de datos admin
			const business = await this.businessRepository.findOne({
				where: { dbName },
				select: ['host', 'port', 'dbName']
			})

			if (!business) {
				throw new NotFoundException(`No se encontró una empresa con el nombre de base de datos: ${dbName}`)
			}

			// Cargar dinámicamente todas las entidades del directorio principal (excluyendo subcarpetas como admin)
			const fs = require('fs')
			const path = require('path')
			const entitiesDir = path.join(__dirname, '../../entities')
			const entityFiles = fs.readdirSync(entitiesDir)
				.filter(file => {
					// Solo archivos .js (no directorios ni otros archivos)
					const filePath = path.join(entitiesDir, file)
					return fs.statSync(filePath).isFile() && file.endsWith('.js')
				})
				.map(file => file.replace('.js', ''))

			const entities = entityFiles.map(entityName => {
				try {
					const entityModule = require(`../../entities/${entityName}`)
					// Obtener la clase de entidad (asumiendo que es la exportación por defecto o tiene el mismo nombre)
					const entityClass = entityModule[entityName] || entityModule.default || Object.values(entityModule)[0]
					if (entityClass) {
						return entityClass
					}
				} catch (error) {
					// Silenciar errores de carga de entidades
				}
			}).filter(Boolean)

			// Crear conexión dinámica con sincronización habilitada
			const businessDataSource = new (require('typeorm').DataSource)({
				type: 'mysql',
				host: business.host,
				port: business.port,
				username: envVars.DB_USER_ADMIN,
				password: envVars.DB_PASSWORD_ADMIN,
				database: business.dbName,
				synchronize: true, // Habilitar sincronización
				timezone: 'local',
				entities: entities
			})

			// Inicializar la conexión (esto creará todas las tablas)
			await businessDataSource.initialize()
			
			// Importar datos de CSV después de crear las tablas
			await this.importCSVData(businessDataSource)
			
			// Cerrar la conexión
			await businessDataSource.destroy()

			return {
				success: true,
				message: `Base de datos ${dbName} sincronizada e importados datos CSV exitosamente`,
				business: {
					host: business.host,
					port: business.port,
					dbName: business.dbName
				}
			}
		} catch (error) {
			console.error('Error syncing database:', error)
			throw new Error(`Error al sincronizar la base de datos ${dbName}: ${error.message}`)
		}
	}

	private async importCSVData(dataSource: any) {
		const fs = require('fs')
		const path = require('path')
		
		// Definir grupos de tablas por dependencias
		const tableGroups = [
			// Grupo 1: Tablas sin dependencias (se pueden importar en paralelo)
			[
				'permission',
				'economic_activity',
				'gender',
				'document_type',
				'position',
				'product_status',
				'business_size',
				'market_scope',
				'strengthening_level',
				'session_status',
				'education_level'
			],
			// Grupo 2: Tablas que dependen de strengthening_level
			['strengthening_area'],
			// Grupo 3: Tablas que dependen de role
			['role'],
			// Grupo 4: Tablas que dependen de menu
			['menu'],
			// Grupo 5: Tablas que dependen de user
			['user'],
			// Grupo 6: Tablas que dependen de role y user
			['admin', 'consultor_type'],
			// Grupo 7: Tablas que dependen de strengthening_level
			['service'],
			// Grupo 8: Tablas que dependen de role y permission
			['role_permission'],
			// Grupo 9: Tablas que dependen de role y menu
			['role_menu'],
			// Grupo 10: Tablas sin dependencias adicionales
			['report_type']
		]

		// Cambiar la ruta para apuntar a la raíz del proyecto
		const exportsDir = path.join(process.cwd(), 'exports')
		
		// Verificar si existe la carpeta exports
		if (!fs.existsSync(exportsDir)) {
			console.log('Carpeta exports no encontrada, saltando importación de CSV')
			return
		}

		console.log('Iniciando importación de datos CSV...')

		// Procesar cada grupo de tablas
		for (let groupIndex = 0; groupIndex < tableGroups.length; groupIndex++) {
			const group = tableGroups[groupIndex]
			console.log(`\n--- Procesando grupo ${groupIndex + 1}/${tableGroups.length} (${group.length} tabla${group.length > 1 ? 's' : ''}) ---`)

			if (group.length === 1) {
				// Importar tabla individual
				await this.importTable(dataSource, group[0], exportsDir)
			} else {
				// Importar múltiples tablas en paralelo
				const importPromises = group.map(table => this.importTable(dataSource, table, exportsDir))
				await Promise.all(importPromises)
			}
		}

		console.log('\nImportación de CSV completada')
	}

	private async importTable(dataSource: any, table: string, exportsDir: string) {
		const fs = require('fs')
		const path = require('path')
		
		const csvFilePath = path.join(exportsDir, `${table}.csv`)
		
		if (!fs.existsSync(csvFilePath)) {
			console.log(`  - Archivo CSV no encontrado para tabla ${table}`)
			return
		}

		try {
			console.log(`  - Importando datos a tabla: ${table}`)
			
			// Leer archivo CSV
			const csvContent = fs.readFileSync(csvFilePath, 'utf8')
			const lines = csvContent.split('\n').filter(line => line.trim() !== '')
			
			if (lines.length <= 1) {
				console.log(`    - Tabla ${table} está vacía en CSV`)
				return
			}

			// Parsear headers
			const headers = lines[0].split(',').map(header => header.trim())
			const dataLines = lines.slice(1)

			// Procesar cada línea de datos
			for (const line of dataLines) {
				const values = this.parseCSVLine(line)
				
				if (values.length !== headers.length) {
					console.log(`    - Saltando línea con formato incorrecto en ${table}`)
					continue
				}

				// Crear objeto de datos
				const rowData: any = {}
				headers.forEach((header, index) => {
					const value = values[index]
					// Convertir valores según el tipo
					if (value === '' || value === 'NULL' || value === 'null') {
						rowData[header] = null
					} else if (!isNaN(Number(value)) && value !== '') {
						rowData[header] = Number(value)
					} else if (header === 'created_at' || header === 'updated_at') {
						// Convertir fechas de JavaScript a formato MySQL
						rowData[header] = this.convertJavaScriptDateToMySQL(value)
					} else {
						rowData[header] = value
					}
				})

				// Insertar datos en la tabla (manejar palabras reservadas)
				const tableName = this.escapeTableName(table)
				const escapedHeaders = headers.map(header => this.escapeColumnName(header))
				await dataSource.query(
					`INSERT INTO ${tableName} (${escapedHeaders.join(', ')}) VALUES (${headers.map(() => '?').join(', ')})`,
					Object.values(rowData)
				)
			}

			console.log(`    - Importados ${dataLines.length} registros a ${table}`)

		} catch (error) {
			console.error(`    - Error importando tabla ${table}:`, error.message)
		}
	}

	private convertJavaScriptDateToMySQL(dateString: string): string | null {
		try {
			// Parsear la fecha de JavaScript
			const date = new Date(dateString)
			
			// Verificar si la fecha es válida
			if (isNaN(date.getTime())) {
				return null
			}
			
			// Convertir a formato MySQL (YYYY-MM-DD HH:MM:SS)
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			const hours = String(date.getHours()).padStart(2, '0')
			const minutes = String(date.getMinutes()).padStart(2, '0')
			const seconds = String(date.getSeconds()).padStart(2, '0')
			
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
		} catch (error) {
			console.log(`    - Error convirtiendo fecha: ${dateString}`)
			return null
		}
	}

	private escapeTableName(tableName: string): string {
		// Escapar palabras reservadas de SQL
		const reservedWords = ['position', 'menu', 'order', 'group', 'user']
		if (reservedWords.includes(tableName.toLowerCase())) {
			return `\`${tableName}\``
		}
		return tableName
	}

	private escapeColumnName(columnName: string): string {
		// Escapar palabras reservadas de SQL para nombres de columnas
		const reservedWords = ['order', 'group', 'user', 'key', 'index', 'table', 'database']
		if (reservedWords.includes(columnName.toLowerCase())) {
			return `\`${columnName}\``
		}
		return columnName
	}

	private parseCSVLine(line: string): string[] {
		const values: string[] = []
		let current = ''
		let inQuotes = false
		
		for (let i = 0; i < line.length; i++) {
			const char = line[i]
			
			if (char === '"') {
				if (inQuotes && line[i + 1] === '"') {
					// Comilla escapada
					current += '"'
					i++ // Saltar la siguiente comilla
				} else {
					// Cambiar estado de comillas
					inQuotes = !inQuotes
				}
			} else if (char === ',' && !inQuotes) {
				// Fin del campo
				values.push(current.trim())
				current = ''
			} else {
				current += char
			}
		}
		
		// Agregar el último campo
		values.push(current.trim())
		
		return values
	}

	private generateToken(payload: JwtPayload) {
		return this.jwtService.sign(payload)
	}
}
