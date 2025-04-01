import { Repository } from 'typeorm'
import { InjectRepository } from '@nestjs/typeorm'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'

import envVars from 'src/config/env'
import { UserEntity } from 'src/entities/user.entity'
import { JwtPayload } from '../interfaces/jwt-payload.interface'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>
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
			throw new UnauthorizedException('Invalid token or inactive user')
		}

		return user //* req.user
	}
}
