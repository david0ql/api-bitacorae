import { Injectable, ExecutionContext } from '@nestjs/common'
import { CacheInterceptor } from '@nestjs/cache-manager'

@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
	trackBy(context: ExecutionContext): string | undefined {
		const request = context.switchToHttp().getRequest()
		if (!request) return super.trackBy(context)

		const { method, originalUrl, headers, user } = request
		if (method !== 'GET') return undefined

		const businessName = headers?.['x-business-name'] || 'none'
		const userId = user?.id ?? 'anon'

		return `biz:${businessName}|user:${userId}|url:${originalUrl}`
	}
}
