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
			
			// Cerrar la conexión
			await businessDataSource.destroy()

			return {
				success: true,
				message: `Base de datos ${dbName} sincronizada exitosamente`,
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

	private generateToken(payload: JwtPayload) {
		return this.jwtService.sign(payload)
	}
}
