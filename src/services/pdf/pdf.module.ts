import { Module } from '@nestjs/common'
import { PdfService } from './pdf.service'
import { DynamicDatabaseModule } from '../dynamic-database/dynamic-database.module'

@Module({
	imports: [DynamicDatabaseModule],
	providers: [PdfService],
	exports: [PdfService]
})

export class PdfModule {}
