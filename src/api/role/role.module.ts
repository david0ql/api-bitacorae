import { Module } from '@nestjs/common'

import { RoleService } from './role.service'
import { RoleController } from './role.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [RoleController],
	providers: [RoleService],
	imports: [DynamicDatabaseModule]
})

export class RoleModule {}
