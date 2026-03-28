import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, from } from 'rxjs'
import { concatMap, map } from 'rxjs/operators'

import { CacheInvalidationService } from './cache-invalidation.service'

@Injectable()
export class CacheInvalidationInterceptor implements NestInterceptor {
	private readonly mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

	constructor(
		private readonly cacheInvalidationService: CacheInvalidationService
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
		const request = context.switchToHttp().getRequest()
		const method = request?.method?.toUpperCase()

		if (!method || !this.mutationMethods.has(method)) {
			return next.handle()
		}

		const route = request?.originalUrl || request?.url || 'unknown-route'
		const reason = `${method} ${route}`

		return next.handle().pipe(
			concatMap((response) =>
				from(this.cacheInvalidationService.clearAll(reason)).pipe(
					map(() => response)
				)
			)
		)
	}
}
