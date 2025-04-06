import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { DocumentTypeService } from './document-type.service'
import { DocumentTypeController } from './document-type.controller'
import { DocumentType } from 'src/entities/DocumentType'

@Module({
	controllers: [DocumentTypeController],
	providers: [DocumentTypeService],
	imports: [TypeOrmModule.forFeature([DocumentType])]
})

export class DocumentTypeModule {}
