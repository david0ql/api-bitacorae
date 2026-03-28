import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { Business } from 'src/entities/admin/Business'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

import { JwtStrategy } from './strategies/jwt.strategy'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { PermissionsGuard } from './guards/permissions.guard'

import envVars from 'src/config/env'

@Module({
	imports: [
		TypeOrmModule.forFeature([Business], envVars.DB_ALIAS_ADMIN),
		DynamicDatabaseModule,
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
