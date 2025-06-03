import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import envVars from 'src/config/env'
import { User } from 'src/entities/User'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: envVars.JWT_SECRET
		})
	}

	async validate(payload: JwtPayload) {
		const { id } = payload

		const user = await this.userRepository.findOne({
			where: { id },
			select: { id: true, roleId: true, email: true, active: true }
		})

		if (!user || !user.active) {
			throw new UnauthorizedException('Usuario no autorizado o inactivo')
		}

		return user //* req.user
	}
}
