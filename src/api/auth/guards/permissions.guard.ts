import { DataSource } from 'typeorm'
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'

import { RolePermissionEntity } from 'src/entities/role_permission.entity'
import { PermissionEntity } from 'src/entities/permission.entity'

@Injectable()
export class PermissionsGuard implements CanActivate {
	constructor(private readonly dataSource: DataSource) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest()
		const user = request.user

		if (!user) return false

		const { roleId } = user
		const endpoint = request.route.path
		const method = request.method

		const result = await this.dataSource
			.getRepository(RolePermissionEntity)
			.createQueryBuilder('rp')
			.innerJoinAndSelect(PermissionEntity, 'p', 'rp.permission_id = p.id')
			.where('rp.role_id = :roleId', { roleId })
			.andWhere('p.endpoint = :endpoint', { endpoint })
			.andWhere('p.method = :method', { method })
			.getOne()

		if (!result) {
			throw new ForbiddenException('You do not have permission to access this resource')
		}

		return true
	}
}
