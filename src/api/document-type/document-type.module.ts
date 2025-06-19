import { Module } from '@nestjs/common'

import { DocumentTypeService } from './document-type.service'
import { DocumentTypeController } from './document-type.controller'
import { DynamicDatabaseModule } from 'src/services/dynamic-database/dynamic-database.module'

@Module({
	controllers: [DocumentTypeController],
	providers: [DocumentTypeService],
	imports: [DynamicDatabaseModule]
})

export class DocumentTypeModule {}
