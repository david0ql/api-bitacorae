import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DocumentTypeService } from './document-type.service'
import { DocumentTypeController } from './document-type.controller'
import { DocumentTypeEntity } from 'src/entities/document_type.entity'

@Module({
	controllers: [DocumentTypeController],
	providers: [DocumentTypeService],
	imports: [TypeOrmModule.forFeature([DocumentTypeEntity])]
})

export class DocumentTypeModule {}
