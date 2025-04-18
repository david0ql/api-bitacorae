import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import * as fs from 'fs'
import * as path from 'path'
import Handlebars from 'handlebars'

import { WelcomeEmailContext } from './interfaces/welcome-email-context.interface'
import { NewSessionEmailContext } from './interfaces/new-session-email-context.interface'
import { NewSessionActivityEmailContext } from './interfaces/new-session-activity-email-context.interface'
import { EndedSessionEmailContext } from './interfaces/ended-session-email-context.interface'
import { ApprovedSessionEmailContext } from './interfaces/approved-session-email-context.inteface'

import envVars from 'src/config/env'

@Injectable()
export class MailService {
	private partialsDir = path.join(process.cwd(), 'src', 'services', 'mail', 'templates', 'partials')
	private varCommons = {
		year: new Date().getFullYear(),
		companyName: 'Bitácora-e',
		appUrl: envVars.APP_URL
	}

	constructor(private readonly mailerService: MailerService) {
		this.registerPartials()
	}

	private registerPartials() {
		if (!fs.existsSync(this.partialsDir)) return

		const files = fs.readdirSync(this.partialsDir)
		files.forEach((file) => {
			const name = file.replace('.hbs', '')
			const content = fs.readFileSync(path.join(this.partialsDir, file), 'utf8')
			Handlebars.registerPartial(name, content)
		})
	}

	async sendWelcomeEmail(context: WelcomeEmailContext) {
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
		const subject = 'Nueva sesión creada'
		const { to, bussinesName, expertName, sessionDate, sessionTime, preparationNotes } = context
		const url = 'https://meet.google.com/example'

		await this.mailerService.sendMail({
			to,
			subject,
			template: 'create-session',
			context: {
				...this.varCommons,
				title: subject,
				bussinesName,
				expertName,
				sessionDate,
				sessionTime,
				preparationNotes,
				url
			},
			attachments: files?.map((file) => ({
				filename: file.originalname,
				path: file.path,
			})) ?? []
		})
	}

	async sendNewSessionActivityEmail(context: NewSessionActivityEmailContext, file?: Express.Multer.File) {
		const subject = 'Nueva actividad de sesión creada'
		const { to, bussinesName, expertName, sessionDate, sessionTime } = context
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
				sessionDate,
				sessionTime,
				url
			},
			attachments: file ? [{
				filename: file.originalname,
				path: file.path
			}] : []
		})
	}

	async sendEndedSessionEmail(context: EndedSessionEmailContext) {
		const subject = 'Sesión finalizada'
		const { to, bussinesName, expertName, sessionDate, sessionTime } = context
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
				sessionDate,
				sessionTime,
				url
			}
		})
	}

	async sendApprovedSessionEmailContext(context: ApprovedSessionEmailContext, /* file: Express.Multer.File */) {
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
			// attachments: [{
			// 	filename: file.originalname,
			// 	path: file.path
			// }]
		})
	}
}
