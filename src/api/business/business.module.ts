import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { BusinessService } from './business.service'
import { BusinessController } from './business.controller'
import { Business } from 'src/entities/Business'
import { User } from 'src/entities/User'

@Module({
	controllers: [BusinessController],
	providers: [BusinessService],
	imports: [TypeOrmModule.forFeature([Business, User])]
})

export class BusinessModule {}
