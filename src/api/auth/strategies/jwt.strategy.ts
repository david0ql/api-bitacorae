import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import envVars from 'src/config/env'
import { User } from 'src/entities/User'
import { JwtPayload } from '../interfaces/jwt-payload.interface'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly dynamicDatabaseService: DynamicDatabaseService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: envVars.JWT_SECRET
		})
	}

	async validate(payload: JwtPayload) {
		const { id, businessName } = payload

		if (!businessName) {
			throw new UnauthorizedException('Business name is required')
		}

		const connection = await this.dynamicDatabaseService.getBusinessConnection(businessName)
		
		if (!connection) {
			throw new UnauthorizedException('No se pudo conectar a la base de datos de la empresa')
		}
		
		try {
			const userRepository = connection.getRepository(User)
			
			const user = await userRepository.findOne({
				where: { id },
				select: { id: true, roleId: true, email: true, active: true }
			})

			if (!user || !user.active) {
				throw new UnauthorizedException('Usuario no autorizado o inactivo')
			}

			return user
		} finally {
			await this.dynamicDatabaseService.closeBusinessConnection(connection)
		}
	}
}
