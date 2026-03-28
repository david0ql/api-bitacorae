import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { Cache } from 'cache-manager'

@Injectable()
export class CacheInvalidationService {
	private readonly logger = new Logger(CacheInvalidationService.name)

	constructor(
		@Inject(CACHE_MANAGER)
		private readonly cacheManager: Cache
	) {}

	async clearAll(reason?: string): Promise<void> {
		try {
			await this.cacheManager.clear()

			if (reason) {
				this.logger.log(`Nest cache invalidated after ${reason}`)
			}
		} catch (error) {
			this.logger.error(
				`Failed to invalidate Nest cache${reason ? ` after ${reason}` : ''}`,
				error instanceof Error ? error.stack : undefined
			)
		}
	}
}
