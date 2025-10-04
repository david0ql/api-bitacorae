import { Injectable } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'
import { Business } from 'src/entities/admin/Business'
import envVars from 'src/config/env'
import { join } from 'path'

@Injectable()
export class DynamicDatabaseService {
	constructor(
		@InjectDataSource(envVars.DB_ALIAS_ADMIN)
		private readonly adminDataSource: DataSource
	) {}

	async getBusinessConnection(businessName: string): Promise<DataSource | null> {
		console.log('🔍 [DYNAMIC DB] Getting business connection for:', businessName)
		try {
			// Get business configuration from admin database
			const businessRepository = this.adminDataSource.getRepository(Business)
			console.log('🔍 [DYNAMIC DB] Looking for business with dbName:', businessName)
			
			const business = await businessRepository.findOne({
				where: { dbName: businessName },
				select: ['host', 'port', 'dbName']
			})

			if (!business) {
				console.log('❌ [DYNAMIC DB] No business found with dbName:', businessName)
				return null
			}

			console.log('🔍 [DYNAMIC DB] Business found:', business)

			// Create a new data source for this business using env credentials
			const businessDataSource = new DataSource({
				type: 'mysql',
				host: business.host,
				port: business.port,
				username: envVars.DB_USER_ADMIN,
				password: envVars.DB_PASSWORD_ADMIN,
				database: business.dbName,
				synchronize: false,
				timezone: 'local',
				entities: [join(__dirname, '../../entities/**/*.{js,ts}')]
			})

			console.log('🔍 [DYNAMIC DB] DataSource created, initializing connection...')
			// Initialize the connection
			await businessDataSource.initialize()
			console.log('🔍 [DYNAMIC DB] Connection initialized successfully')
			
			return businessDataSource
		} catch (error) {
			console.error('❌ [DYNAMIC DB] Error creating business connection:', error)
			console.error('❌ [DYNAMIC DB] Error details:', {
				message: error.message,
				code: error.code,
				errno: error.errno,
				sqlState: error.sqlState
			})
			return null
		}
	}

	async closeBusinessConnection(dataSource: DataSource): Promise<void> {
		try {
			if (dataSource && dataSource.isInitialized) {
				await dataSource.destroy()
			}
		} catch (error) {
			console.error('Error closing business connection:', error)
		}
	}
} 