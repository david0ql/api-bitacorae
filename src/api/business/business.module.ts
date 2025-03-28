import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { BusinessService } from './business.service'
import { BusinessController } from './business.controller'
import { BusinessEntity } from 'src/entities/business.entity'
import { UserEntity } from 'src/entities/user.entity'

@Module({
	controllers: [BusinessController],
	providers: [BusinessService],
	imports: [TypeOrmModule.forFeature([BusinessEntity, UserEntity])]
})

export class BusinessModule {}
