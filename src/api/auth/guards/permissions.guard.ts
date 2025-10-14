import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

import { RolePermission } from 'src/entities/RolePermission'
import { Permission } from 'src/entities/Permission'
import { RedisService } from 'src/services/redis/redis.service'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(
		private readonly dynamicDbService: DynamicDatabaseService,
		private readonly redisService: RedisService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		return true

		// const request = context.switchToHttp().getRequest()
		// const user = request.user

		// if (!user) return false

		// const { roleId, businessName } = user
		// const endpoint = request.route.path
		// const method = request.method
		// const cacheKey = `role:${roleId}:permissions`

    	// let permissions: { endpoint: string; method: string }[]

		// const cachedPermissions = await this.redisService.get(cacheKey)

		// if (cachedPermissions) {
		// 	permissions = JSON.parse(cachedPermissions)
		// } else {
		// 	const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		// 	if (!businessDataSource) return false

		// 	try {
		// 		permissions = await businessDataSource
		// 			.getRepository(RolePermission)
		// 			.createQueryBuilder('rp')
		// 			.innerJoinAndSelect(Permission, 'p', 'rp.permission_id = p.id')
		// 			.where('rp.role_id = :roleId', { roleId })
		// 			.select(['p.endpoint AS endpoint', 'p.method AS method'])
		// 			.getRawMany()
		// 	} finally {
		// 		// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
		// 	}

		// 	await this.redisService.set(cacheKey, JSON.stringify(permissions), 3600) //* TTL de 1 hora
		// }

		// const hasPermission = permissions.some((p) => p.endpoint === endpoint && p.method === method)

		// if (!hasPermission) {
		// 	throw new ForbiddenException('You do not have permission to access this resource')
		// }

		// return true
	}
}
