import { Module } from '@nestjs/common'
import { PdfService } from './pdf.service'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Platform } from 'src/entities/Platform'

@Module({
	imports: [TypeOrmModule.forFeature([Platform])],
	providers: [PdfService],
	exports: [PdfService]
})

export class PdfModule {}
