import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UserEntity } from 'src/entities/user.entity'
import envVars from 'src/config/env'

import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { PermissionsGuard } from './guards/permissions.guard'

@Module({
	imports: [
		TypeOrmModule.forFeature([UserEntity]),
		JwtModule.register({
			secret: envVars.JWT_SECRET,
			signOptions: { expiresIn: '1h' },
		})
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, JwtAuthGuard, PermissionsGuard],
	exports: [JwtModule, JwtAuthGuard, PermissionsGuard]
})

export class AuthModule {}
