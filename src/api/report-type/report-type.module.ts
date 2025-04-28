import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ReportTypeService } from './report-type.service'
import { ReportTypeController } from './report-type.controller'
import { ReportType } from 'src/entities/ReportType'

@Module({
	controllers: [ReportTypeController],
	providers: [ReportTypeService],
	imports: [TypeOrmModule.forFeature([ReportType])]
})

export class ReportTypeModule {}
