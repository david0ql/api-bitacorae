import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
	constructor(private mailerService: MailerService) {}

	async sendWelcomeEmail(to: string, name: string) {
		await this.mailerService.sendMail({
			to,
			subject: '¡Bienvenido!',
			template: 'create-user',
			context: { name },
		})
	}

}
