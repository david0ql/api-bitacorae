import { Repository } from 'typeorm'
import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'

import { AuthDto } from './dto/user.dto'
import { UserEntity } from 'src/entities/user.entity'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from './interfaces/jwt-payload.interface'

@Injectable()
export class AuthService {
	constructor(
		@InjectRepository(UserEntity)
		private readonly userRepository: Repository<UserEntity>,
		private readonly jwtService: JwtService
	) {}

	async login(authDto: AuthDto) {
		const { email, password } = authDto

		const user = await this.userRepository.findOne({
			where: { email },
			select: { id: true, roleId: true, password: true },
		})

		if (!user) throw new NotFoundException('User not found')
		if (!bcrypt.compareSync(password, user.password)) throw new NotFoundException('User not found')

		const payload = { id: user.id, roleId: user.roleId, email }

		return { token: this.generateToken(payload) }
	}

	private generateToken(payload: JwtPayload) {
		return this.jwtService.sign(payload)
	}
}
