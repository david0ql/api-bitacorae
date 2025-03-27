import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UserEntity } from 'src/entities/user.entity'
import envVars from 'src/config/env'

@Module({
	controllers: [AuthController],
	providers: [AuthService],
	imports: [
		JwtModule.register({
			secret: envVars.JWT_SECRET,
			signOptions: { expiresIn: '1h' },
		}),
		TypeOrmModule.forFeature([UserEntity])
	]
})

export class AuthModule {}
