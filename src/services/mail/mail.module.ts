import { Module } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { MailService } from './mail.service'
import { DynamicDatabaseModule } from '../dynamic-database/dynamic-database.module'

import envVars from 'src/config/env'

@Module({
	imports: [
		DynamicDatabaseModule,
		MailerModule.forRoot({
			transport: {
				host: envVars.MAIL_HOST,
				port: envVars.MAIL_PORT,
				secure: false,
				auth: {
					user: envVars.MAIL_USER,
					pass: envVars.MAIL_PASSWORD
				}
			},
			defaults: {
				from: `"${envVars.MAIL_FROM_NAME}" <${envVars.MAIL_FROM}>`
			},
			template: {
				dir: __dirname + '/templates',
				adapter: new HandlebarsAdapter(),
				options: {
					strict: true
				}
			}
		})
	],
	providers: [MailService],
	exports: [MailService]
})

export class MailModule {}
