import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import * as fs from 'fs'
import * as path from 'path'
import Handlebars from 'handlebars'

import envVars from 'src/config/env'
import { WelcomeEmailContext } from './interfaces/welcome-email-context.interface'

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
				url: 'https://google.com'
			}
		})
	}
}
