import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import * as fs from 'fs'
import * as path from 'path'
import * as sanitizeHtml from 'sanitize-html'
import Handlebars from 'handlebars'

import { WelcomeEmailContext } from './interfaces/welcome-email-context.interface'
import { NewSessionEmailContext } from './interfaces/new-session-email-context.interface'
import { NewSessionActivityEmailContext } from './interfaces/new-session-activity-email-context.interface'
import { EndedSessionEmailContext } from './interfaces/ended-session-email-context.interface'
import { ApprovedSessionEmailContext } from './interfaces/approved-session-email-context.inteface'
import { FileInfo } from '../pdf/interfaces/file-info.interface'
import { InjectRepository } from '@nestjs/typeorm'
import { Platform } from 'src/entities/Platform'
import { Repository } from 'typeorm'

import envVars from 'src/config/env'

Handlebars.registerHelper('sanitizeHtmlEmail', (html: string) => {
	const clean = sanitizeHtml(html, {
		allowedTags: [
			'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'span',
			'div', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4'
		],
		allowedAttributes: {
			a: ['href', 'target', 'rel'],
			img: ['src', 'alt', 'width', 'height', 'style'],
			p: ['style'],
			div: ['style'],
			span: ['style'],
			td: ['style'],
			th: ['style']
		},
		allowedSchemes: ['http', 'https', 'mailto', 'data'],
		allowedStyles: {
			'*': {
				'color': [/^.*$/],
				'font-weight': [/^.*$/],
				'text-decoration': [/^.*$/],
				'font-size': [/^.*$/],
				'text-align': [/^.*$/],
				'background-color': [/^.*$/],
				'width': [/^.*$/],
				'height': [/^.*$/]
			}
		}
	})

	return new Handlebars.SafeString(clean)
})

@Injectable()
export class MailService {
	private partialsDir = path.join(process.cwd(), 'src', 'services', 'mail', 'templates', 'partials')
	private varCommons = {
		year: new Date().getFullYear(),
		companyName: 'Bitácora-e',
		programName: 'Consultorio Empresarial de Colsubsidio operado por BICTIA',
		appUrl: envVars.APP_URL,
		logoUrl: `${envVars.APP_URL}/assets/email/logo_bictoria.jpg`
	}

	constructor(
		private readonly mailerService: MailerService,

		@InjectRepository(Platform)
		private readonly platformRepository: Repository<Platform>
	) { this.registerPartials() }

	private registerPartials() {
		if (!fs.existsSync(this.partialsDir)) return

		const files = fs.readdirSync(this.partialsDir)
		files.forEach((file) => {
			const name = file.replace('.hbs', '')
			const content = fs.readFileSync(path.join(this.partialsDir, file), 'utf8')
			Handlebars.registerPartial(name, content)
		})
	}

	private async getPlatformVars() {
		const platform = await this.platformRepository.findOne({ where: {} })
		if(platform?.logoPath) {
			this.varCommons.logoUrl = `${envVars.APP_URL}/${platform.logoPath}`
		}

		if(platform?.programName) {
			this.varCommons.programName = platform.programName
		}
	}

	async sendWelcomeEmail(context: WelcomeEmailContext) {
		await this.getPlatformVars()

		const subject = 'Bienvenido a Bitácora-e'
		const { name, email, password } = context
		const url = 'https://google.com'

		await this.mailerService.sendMail({
			to: email,
			subject,
			template: 'create-user',
			context: {
				...this.varCommons,
				title: subject,
				name,
				email,
				password,
				url
			}
		})
	}

	async sendNewSessionEmail(context: NewSessionEmailContext, files?: Express.Multer.File[]) {
		await this.getPlatformVars()

		const subject = 'Nueva sesión creada'
		const { to, bussinesName, expertName, sessionDateTime, conferenceLink, preparationNotes } = context

		await this.mailerService.sendMail({
			to,
			subject,
			template: 'create-session',
			context: {
				...this.varCommons,
				title: subject,
				bussinesName,
				expertName,
				sessionDateTime,
				conferenceLink,
				preparationNotes
			},
			attachments: files?.map((file) => ({
				filename: file.originalname,
				path: file.path,
			})) ?? []
		})
	}

	async sendNewSessionActivityEmail(context: NewSessionActivityEmailContext, file?: Express.Multer.File) {
		await this.getPlatformVars()

		const subject = 'Nueva actividad de sesión creada'
		const { to, bussinesName, expertName, sessionDateTime } = context
		const url = 'https://google.com'

		await this.mailerService.sendMail({
			to,
			subject,
			template: 'create-session-activity',
			context: {
				...this.varCommons,
				title: subject,
				bussinesName,
				expertName,
				sessionDateTime,
				url
			},
			attachments: file ? [{
				filename: file.originalname,
				path: file.path
			}] : []
		})
	}

	async sendEndedSessionEmail(context: EndedSessionEmailContext) {
		await this.getPlatformVars()

		const subject = 'Sesión finalizada'
		const { to, bussinesName, expertName, sessionDateTime } = context
		const url = 'https://google.com'

		await this.mailerService.sendMail({
			to,
			subject,
			template: 'ended-session',
			context: {
				...this.varCommons,
				title: subject,
				bussinesName,
				expertName,
				sessionDateTime,
				url
			}
		})
	}

	async sendApprovedSessionEmailContext(context: ApprovedSessionEmailContext, file: FileInfo) {
		await this.getPlatformVars()

		const subject = 'Sesión aprobada'
		const { to, bussinesName } = context

		await this.mailerService.sendMail({
			to,
			subject,
			template: 'approved-session',
			context: {
				...this.varCommons,
				title: subject,
				bussinesName
			},
			attachments: [{
				filename: file.fileName,
				path: file.filePath
			}]
		})
	}
}
