import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'

@Injectable()
export class PermissionsGuard implements CanActivate {
	async canActivate(_context: ExecutionContext): Promise<boolean> {
		return true
	}
}
