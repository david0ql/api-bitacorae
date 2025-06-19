import { Injectable, OnModuleDestroy } from '@nestjs/common'
import * as fs from 'fs'
import * as path from 'path'
import * as Handlebars from 'handlebars'
import * as puppeteer from 'puppeteer'
import { v4 as uuidv4 } from 'uuid'
import * as sanitizeHtml from 'sanitize-html'
import { PDFDocument, StandardFonts } from 'pdf-lib'

import { GenerateSessionPdfData } from './interfaces/generate-session-pdf.interface'
import { GenerateReportBySessionPdfData } from './interfaces/generate-report-by-session-pdf.interface'
import { GenerateReportByBusinessPdfData } from './interfaces/generate-report-by-business-pdf.interface'
import { FileInfo } from './interfaces/file-info.interface'
import { Platform } from 'src/entities/Platform'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

import envVars from 'src/config/env'
import { GenerateReportByExpertPdfData } from './interfaces/generate-report-by-expert-pdf.interface'

Handlebars.registerHelper('inc', (value) => {
	return parseInt(value) + 1
})

Handlebars.registerHelper('isNumber', (value) => {
	return typeof value === 'number' && !isNaN(value)
})

Handlebars.registerHelper('eq', function(a, b) {
	return a === b
})

Handlebars.registerHelper('sanitizeHtmlPdf', (html: string) => {
	const clean = sanitizeHtml(html, {
		allowedTags: [
			'p', 'b', 'i', 'strong', 'em', 'u', 'ul', 'ol', 'li',
			'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'table', 'thead', 'tbody', 'tr', 'td', 'th',
			'div', 'span', 'img'
		],
		allowedAttributes: {
			a: ['href'],
			img: ['src', 'alt', 'width', 'height', 'style'],
			div: ['style'],
			span: ['style'],
			td: ['style'],
			th: ['style'],
			p: ['style']
		},
		allowedSchemes: ['http', 'https', 'data'],
		allowedStyles: {
			'*': {
				'color': [/^.*$/],
				'font-weight': [/^.*$/],
				'text-align': [/^.*$/],
				'font-size': [/^.*$/],
				'background-color': [/^.*$/],
				'width': [/^.*$/],
				'height': [/^.*$/]
			}
		},

		allowCommentTag: false
	})

	return new Handlebars.SafeString(clean)
})

@Injectable()
export class PdfService implements OnModuleDestroy {
	private browser: puppeteer.Browser | null = null

	constructor(
		private readonly dynamicDbService: DynamicDatabaseService
	) { this.initBrowser() }

	private async initBrowser() {
		if (!this.browser) {
			this.browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
		}
	}

	async onModuleDestroy() {
		if (this.browser) {
			await this.browser.close()
		}
	}

	private async createPdfFromTemplate(templatePath: string, data: any, businessName: string): Promise<Buffer> {
		const htmlTemplate = fs.readFileSync(templatePath, 'utf8')
		const template = Handlebars.compile(htmlTemplate)

		let platform: Platform | null = null
		if (businessName) {
			const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
			
			if (businessDataSource) {
				try {
					const platformRepository = businessDataSource.getRepository(Platform)
					platform = await platformRepository.findOne({ where: {} })
				} finally {
					await this.dynamicDbService.closeBusinessConnection(businessDataSource)
				}
			}
		}

		const reportHeaderImageUrl = platform?.reportHeaderImagePath ? `${envVars.APP_URL}/${platform.reportHeaderImagePath}` : ''
		const programImageUrl = platform?.logoPath ? `${envVars.APP_URL}/${platform.logoPath}` : ''
		const programName = platform?.programName || 'Consultorio Empresarial de Colsubsidio operado por BICTIA'

		const html = template({
			programImageUrl,
			reportHeaderImageUrl,
			programName,
			...data
		})

		const page = await this.browser!.newPage()
		await page.setContent(html, { waitUntil: 'networkidle0' })

		const pdfBuffer = Buffer.from(await page.pdf({
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
		}))

		await page.close()

		return pdfBuffer
	}

	private async createAnnexPage(): Promise<Buffer> {
		const annexPdfDoc = await PDFDocument.create()
		const annexPage = annexPdfDoc.addPage([595.28, 841.89]) // tamaño A4 en puntos

		const { width, height } = annexPage.getSize()
		const fontSize = 26
		const annexFont = await annexPdfDoc.embedFont(StandardFonts.HelveticaBold)
		const text = 'ARCHIVOS ANEXOS'
		const textWidth = annexFont.widthOfTextAtSize(text, fontSize)

		annexPage.drawText(text, {
			x: (width - textWidth) / 2,
			y: (height - fontSize) / 2,
			size: fontSize,
			font: annexFont
		})

		const annexPdfBuffer = Buffer.from(await annexPdfDoc.save())
		return annexPdfBuffer
	}

	private async combinePdfs(mainPdfBuffer: Buffer, annexPdfBuffer: Buffer, attachmentPaths: string[]): Promise<Buffer> {
		const finalPdf = await PDFDocument.create()

		const mainPdfDoc = await PDFDocument.load(mainPdfBuffer)
		const mainPages = await finalPdf.copyPages(mainPdfDoc, mainPdfDoc.getPageIndices())
		mainPages.forEach(page => finalPdf.addPage(page))

		const annexDoc = await PDFDocument.load(annexPdfBuffer)
		const annexPages = await finalPdf.copyPages(annexDoc, annexDoc.getPageIndices())
		annexPages.forEach(page => finalPdf.addPage(page))

		const validAttachmentPaths = this.filterExistingAttachments(attachmentPaths)

		for (const attachmentPath of validAttachmentPaths) {
			const attachmentBuffer = fs.readFileSync(path.join(process.cwd(), attachmentPath))
			const attachmentPdf = await PDFDocument.load(attachmentBuffer)
			const attachmentPages = await finalPdf.copyPages(attachmentPdf, attachmentPdf.getPageIndices())
			attachmentPages.forEach(page => finalPdf.addPage(page))
		}

		const finalPdfBuffer = Buffer.from(await finalPdf.save())
		return finalPdfBuffer
	}

	private filterExistingAttachments(attachmentPaths: string[]): string[] {
		const existingPaths: string[] = []

		for (const relativePath of attachmentPaths) {
			const fullPath = path.join(process.cwd(), relativePath)
			if (fs.existsSync(fullPath)) {
				existingPaths.push(relativePath)
			}
		}

		return existingPaths
	}

	async generateSessionPdf(data: GenerateSessionPdfData, businessName: string): Promise<FileInfo> {
		const internalPath = path.join('generated', 'session', data.sign ? 'approved' : 'unApproved')
		const outputDir = path.join(process.cwd(), internalPath)
		const templatePath = path.join(process.cwd(), 'src', 'services', 'pdf', 'templates', 'session-summary.hbs')

		const fileName = `${uuidv4()}.pdf`
		const filePath = path.join(internalPath, fileName)

		const pdfBuffer = await this.createPdfFromTemplate(templatePath, data, businessName)
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		fs.writeFileSync(path.join(process.cwd(), filePath), pdfBuffer)

		return { fileName, filePath }
	}

	async generateReportBySessionPdf(data: GenerateReportBySessionPdfData, businessName: string): Promise<FileInfo> {
		const internalPath = path.join('generated', 'report', 'session')
		const outputDir = path.join(process.cwd(), internalPath)
		const templatePath = path.join(process.cwd(), 'src', 'services', 'pdf', 'templates', 'report-by-session.hbs')

		const fileName = `${uuidv4()}.pdf`
		const filePath = path.join(internalPath, fileName)

		const pdfBuffer = await this.createPdfFromTemplate(templatePath, data, businessName)
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		fs.writeFileSync(path.join(process.cwd(), filePath), pdfBuffer)

		return { fileName, filePath }
	}

	async generateReportByBusinessPdf(data: GenerateReportByBusinessPdfData, attachmentPaths: string[], route: string = 'business', businessName: string): Promise<FileInfo> {
		const internalPath = path.join('generated', 'report', route)
		const outputDir = path.join(process.cwd(), internalPath)
		const templatePath = path.join(process.cwd(), 'src', 'services', 'pdf', 'templates', 'report-by-business.hbs')

		const fileName = `${uuidv4()}.pdf`
		const filePath = path.join(internalPath, fileName)

		const mainPdfBuffer = await this.createPdfFromTemplate(templatePath, data, businessName)
		const annexPdfBuffer = await this.createAnnexPage()

		const finalPdfBuffer = await this.combinePdfs(mainPdfBuffer, annexPdfBuffer, attachmentPaths)

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		fs.writeFileSync(path.join(process.cwd(), filePath), finalPdfBuffer)

		return { fileName, filePath }
	}

	async generateReportByExpertPdf(data: GenerateReportByExpertPdfData, attachmentPaths: string[], businessName: string): Promise<FileInfo> {
		const internalPath = path.join('generated', 'report', 'expert')
		const outputDir = path.join(process.cwd(), internalPath)
		const templatePath = path.join(process.cwd(), 'src', 'services', 'pdf', 'templates', 'report-by-expert.hbs')

		const fileName = `${uuidv4()}.pdf`
		const filePath = path.join(internalPath, fileName)

		const mainPdfBuffer = await this.createPdfFromTemplate(templatePath, data, businessName)
		const annexPdfBuffer = await this.createAnnexPage()

		const finalPdfBuffer = await this.combinePdfs(mainPdfBuffer, annexPdfBuffer, attachmentPaths)

		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true })
		}

		fs.writeFileSync(path.join(process.cwd(), filePath), finalPdfBuffer)

		return { fileName, filePath }
	}
}
