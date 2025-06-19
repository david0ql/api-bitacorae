import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DynamicDatabaseService } from './dynamic-database.service'
import { DynamicEntityService } from './dynamic-entity.service'
import { Business } from 'src/entities/admin/Business'
import envVars from 'src/config/env'

@Module({
	imports: [
		TypeOrmModule.forFeature([Business], envVars.DB_ALIAS_ADMIN)
	],
	providers: [DynamicDatabaseService, DynamicEntityService],
	exports: [DynamicDatabaseService, DynamicEntityService]
})
export class DynamicDatabaseModule {} 