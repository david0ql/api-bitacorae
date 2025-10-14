import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { DataSource } from 'typeorm'
import { InjectDataSource } from '@nestjs/typeorm'
import { Business } from 'src/entities/admin/Business'
import envVars from 'src/config/env'
import { join } from 'path'

@Injectable()
export class DynamicDatabaseService implements OnModuleInit, OnModuleDestroy {
	private connectionCache = new Map<string, DataSource>()
	private readonly CACHE_TIMEOUT = 5 * 60 * 1000 // 5 minutos
	private readonly CLEANUP_INTERVAL = 2 * 60 * 1000 // 2 minutos
	private connectionTimestamps = new Map<string, number>()
	private cleanupInterval: NodeJS.Timeout

	constructor(
		@InjectDataSource(envVars.DB_ALIAS_ADMIN)
		private readonly adminDataSource: DataSource
	) {}

	onModuleInit() {
		// Start periodic cleanup of expired connections
		this.cleanupInterval = setInterval(() => {
			this.cleanupExpiredConnections()
		}, this.CLEANUP_INTERVAL)
		console.log('🚀 [DYNAMIC DB] Connection cache cleanup started')
	}

	onModuleDestroy() {
		// Clean up interval and all connections when module is destroyed
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval)
		}
		this.clearAllConnections()
		console.log('🛑 [DYNAMIC DB] Connection cache cleanup stopped')
	}

	async getBusinessConnection(businessName: string): Promise<DataSource | null> {
		console.log('🔍 [DYNAMIC DB] Getting business connection for:', businessName)
		
		// Check if we have a cached connection
		const cachedConnection = this.connectionCache.get(businessName)
		const connectionTimestamp = this.connectionTimestamps.get(businessName)
		
		if (cachedConnection && connectionTimestamp) {
			// Check if connection is still valid and not expired
			const isExpired = Date.now() - connectionTimestamp > this.CACHE_TIMEOUT
			const isInitialized = cachedConnection.isInitialized
			
			if (!isExpired && isInitialized) {
				// Verify connection is actually working
				try {
					// Simple query to test connection
					await cachedConnection.query('SELECT 1')
					console.log('✅ [DYNAMIC DB] Using cached connection for:', businessName)
					// Update timestamp to keep connection alive
					this.connectionTimestamps.set(businessName, Date.now())
					return cachedConnection
				} catch (error) {
					console.log('⚠️ [DYNAMIC DB] Cached connection is dead, will reconnect:', businessName)
					await this.removeConnectionFromCache(businessName)
					// Continue to create new connection below
				}
			} else {
				console.log('🔄 [DYNAMIC DB] Cached connection expired or invalid, removing from cache:', businessName)
				await this.removeConnectionFromCache(businessName)
			}
		}

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
			
			// Cache the connection
			this.connectionCache.set(businessName, businessDataSource)
			this.connectionTimestamps.set(businessName, Date.now())
			console.log('💾 [DYNAMIC DB] Connection cached for:', businessName)
			
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

	/**
	 * @deprecated DO NOT USE - Connections are now cached and managed automatically
	 * This method is kept for backwards compatibility but should NOT be called
	 * The cache system will handle connection lifecycle automatically
	 */
	async closeBusinessConnection(dataSource: DataSource): Promise<void> {
		// DO NOTHING - connections are managed by cache
		console.log('⚠️ [DYNAMIC DB] closeBusinessConnection called but ignored - connections are cached')
		return
	}

	private async removeConnectionFromCache(businessName: string): Promise<void> {
		const cachedConnection = this.connectionCache.get(businessName)
		if (cachedConnection) {
			try {
				if (cachedConnection.isInitialized) {
					await cachedConnection.destroy()
				}
			} catch (error) {
				console.error('Error destroying cached connection:', error)
			}
		}
		this.connectionCache.delete(businessName)
		this.connectionTimestamps.delete(businessName)
		console.log('🗑️ [DYNAMIC DB] Removed connection from cache:', businessName)
	}

	async cleanupExpiredConnections(): Promise<void> {
		const now = Date.now()
		const expiredConnections: string[] = []

		for (const [businessName, timestamp] of this.connectionTimestamps.entries()) {
			if (now - timestamp > this.CACHE_TIMEOUT) {
				expiredConnections.push(businessName)
			}
		}

		for (const businessName of expiredConnections) {
			await this.removeConnectionFromCache(businessName)
		}

		if (expiredConnections.length > 0) {
			console.log('🧹 [DYNAMIC DB] Cleaned up', expiredConnections.length, 'expired connections')
		}
	}

	getCacheStats(): { totalConnections: number, connections: string[] } {
		return {
			totalConnections: this.connectionCache.size,
			connections: Array.from(this.connectionCache.keys())
		}
	}

	async clearAllConnections(): Promise<void> {
		console.log('🧹 [DYNAMIC DB] Clearing all cached connections')
		for (const businessName of this.connectionCache.keys()) {
			await this.removeConnectionFromCache(businessName)
		}
	}
} 