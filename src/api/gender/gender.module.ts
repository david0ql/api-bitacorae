import { Module } from '@nestjs/common'

import { GenderService } from './gender.service'
import { GenderController } from './gender.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [GenderController],
	providers: [GenderService],
	imports: [DynamicDatabaseModule]
})

export class GenderModule {}
