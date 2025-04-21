import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as Handlebars from 'handlebars'
import * as puppeteer from 'puppeteer'
import { v4 as uuidv4 } from 'uuid'

import { GenerateSessionPdfData } from './interfaces/generate-session-pdf.interface'
import { FileInfo } from './interfaces/file-info.interface'

@Injectable()
export class PdfService {
	async generateSessionPdf(data: GenerateSessionPdfData): Promise<FileInfo> {
		const internalPath = path.join('generated', 'session', data.sign ? 'approved' : 'unApproved')
		const outputDir = path.join(process.cwd(), internalPath)
		const templatePath = path.join(process.cwd(), 'src', 'services', 'pdf', 'templates', 'session-summary.hbs')

		const fileName = `${uuidv4()}.pdf`
		const filePath = path.join(internalPath, fileName)

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
			`,
		})
		await browser.close()

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		fs.writeFileSync(path.join(process.cwd(), filePath), pdfBuffer)

		return { fileName, filePath }
	}
}
