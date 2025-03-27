import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { RoleService } from './role.service'
import { RoleController } from './role.controller'
import { RoleEntity } from 'src/entities/role.entity'

@Module({
	controllers: [RoleController],
	providers: [RoleService],
	imports: [TypeOrmModule.forFeature([RoleEntity])]
})

export class RoleModule {}
