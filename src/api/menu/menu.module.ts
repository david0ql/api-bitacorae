import { Module } from '@nestjs/common'

import { MenuService } from './menu.service'
import { MenuController } from './menu.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [MenuController],
	providers: [MenuService],
	imports: [DynamicDatabaseModule]
})

export class MenuModule {}
