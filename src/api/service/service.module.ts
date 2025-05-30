import { TypeOrmModule } from '@nestjs/typeorm'
import { Module } from '@nestjs/common'

import { ServiceService } from './service.service'
import { ServiceController } from './service.controller'
import { Service } from 'src/entities/Service'
import { StrengtheningLevel } from 'src/entities/StrengtheningLevel'

@Module({
	controllers: [ServiceController],
	providers: [ServiceService],
	imports: [TypeOrmModule.forFeature([Service, StrengtheningLevel])]
})

export class ServiceModule { }
