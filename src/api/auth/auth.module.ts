import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { User } from 'src/entities/User'

import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { PermissionsGuard } from './guards/permissions.guard'

import envVars from 'src/config/env'

@Module({
	imports: [
		TypeOrmModule.forFeature([User]),
		JwtModule.register({
			secret: envVars.JWT_SECRET,
			// signOptions: { expiresIn: '1h' }
		})
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, JwtAuthGuard, PermissionsGuard],
	exports: [JwtModule, JwtAuthGuard, PermissionsGuard]
})

export class AuthModule {}
