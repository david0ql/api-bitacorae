import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as Handlebars from 'handlebars'
import * as puppeteer from 'puppeteer'
import { PDFDocument, rgb } from 'pdf-lib'
import { v4 as uuidv4 } from 'uuid'

import { GenerateSessionPdfData } from './interfaces/generate-session-pdf.interface'

@Injectable()
export class PdfService {
	async generateSessionPdf(data: GenerateSessionPdfData): Promise<{ fileName: string, filePath: string }> {
		const outputDir = path.join(process.cwd(), 'generated', 'session')
		const templatePath = path.join(process.cwd(), 'src', 'services', 'pdf', 'templates', 'session-summary.hbs')

		const htmlTemplate = fs.readFileSync(templatePath, 'utf8')
		const template = Handlebars.compile(htmlTemplate)
		const html = template(data)

		const browser = await puppeteer.launch({ headless: true })
		const page = await browser.newPage()
		await page.setContent(html, { waitUntil: 'networkidle0' })

		const pdfBuffer = await page.pdf({
			format: 'A4',
			printBackground: true,
			margin: {
				top: '20mm',
				right: '20mm',
				bottom: '20mm',
				left: '20mm',
			},
			displayHeaderFooter: true,
			headerTemplate: '<span></span>',
			footerTemplate: `
				<div style="
					font-size:10px;
					color:#555;
					font-family:Arial, sans-serif;
					position: absolute;
					bottom: 6mm;
					left: 20mm;
					width: calc(100% - 40mm);
					display: flex;
					justify-content: space-between;
				">
					<div>Documento generado por <strong>Bitácora-e</strong></div>
					<div>Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
				</div>
			`
		})
		await browser.close()

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		const fileName = `${uuidv4()}.pdf`
		const relativePath = path.join('/generated/session', fileName)

		const outputPath = path.join(outputDir, fileName)
		fs.writeFileSync(outputPath, pdfBuffer)

		return { fileName, filePath: relativePath}
	}

	// async signPdf(pdfBuffer: Buffer, options: { nombre: string, fecha: string }): Promise<Buffer> {
	// 	const pdfDoc = await PDFDocument.load(pdfBuffer)
	// 	const pages = pdfDoc.getPages()
	// 	const lastPage = pages[pages.length - 1]
	// 	const fontSize = 10

	// 	lastPage.drawText(`Firmado por: ${options.nombre}`, {
	// 		x: 50,
	// 		y: 50,
	// 		size: fontSize,
	// 		color: rgb(0, 0, 0),
	// 	})

	// 	lastPage.drawText(`Fecha de firma: ${options.fecha}`, {
	// 		x: 50,
	// 		y: 35,
	// 		size: fontSize,
	// 		color: rgb(0, 0, 0),
	// 	})

	// 	return Buffer.from(await pdfDoc.save())
	// }
}
