import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DynamicDatabaseService } from './dynamic-database.service'
import { DynamicEntityService } from './dynamic-entity.service'
import { Business } from 'src/entities/admin/Business'
import envVars from 'src/config/env'

@Module({
	imports: [
		TypeOrmModule.forRoot({
			type: 'mysql',
			name: envVars.DB_ALIAS_ADMIN,
			host: envVars.DB_HOST_ADMIN,
			port: envVars.DB_PORT_ADMIN,
			username: envVars.DB_USER_ADMIN,
			password: envVars.DB_PASSWORD_ADMIN,
			database: envVars.DB_NAME_ADMIN,
			synchronize: false,
			autoLoadEntities: true,
			timezone: 'local'
		}),
		TypeOrmModule.forFeature([Business], envVars.DB_ALIAS_ADMIN)
	],
	providers: [DynamicDatabaseService, DynamicEntityService],
	exports: [DynamicDatabaseService, DynamicEntityService]
})
export class DynamicDatabaseModule {} 