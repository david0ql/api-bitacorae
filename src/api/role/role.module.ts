import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { RoleService } from './role.service'
import { RoleController } from './role.controller'
import { Role } from 'src/entities/Role'

@Module({
	controllers: [RoleController],
	providers: [RoleService],
	imports: [TypeOrmModule.forFeature([Role])]
})

export class RoleModule {}
