import { Injectable, Logger } from '@nestjs/common'
import { createClient, RedisClientType } from 'redis'

import envVars from 'src/config/env'

@Injectable()
export class RedisService {
	private client: RedisClientType
	private isRedisConnected = true
 	private readonly logger = new Logger(RedisService.name)

	constructor() {
		this.client = createClient({
			socket: {
				host: envVars.REDIS_HOST,
				port: envVars.REDIS_PORT
			},
		})

		this.client.connect().catch((err) => {
			this.isRedisConnected = false
			this.logger.error('Redis connection failed', err)
		})
	}

	private async safeExecute<T>(callback: () => Promise<T>): Promise<T | null> {
		if (!this.isRedisConnected) {
			this.logger.warn('Redis is not connected, skipping cache operations')
			return null
		}

		try {
		  	return await callback()
		} catch (e) {
			this.logger.error('Error executing Redis operation', e)
			return null
		}
	}

	async get(key: string): Promise<string | null> {
		return this.safeExecute(() => this.client.get(key))
	}

	async set(key: string, value: string, ttl: number = 3600): Promise<void> {
		await this.safeExecute(() => this.client.set(key, value, { EX: ttl }))
	}

	async del(key: string): Promise<void> {
		await this.safeExecute(() => this.client.del(key))
	}
}
