import { Module } from '@nestjs/common'
import { MailerModule } from '@nestjs-modules/mailer'
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter'
import { join } from 'path'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Platform } from 'src/entities/Platform'

import { MailService } from './mail.service'
import envVars from 'src/config/env'

@Module({
	imports: [
		MailerModule.forRootAsync({
			useFactory: () => ({
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
					dir: join(process.cwd(), 'src', 'services', 'mail', 'templates'),
					adapter: new HandlebarsAdapter(),
					options: {
						strict: true
					}
				}
			})
		}),
		TypeOrmModule.forFeature([Platform])
	],
	providers: [MailService],
	exports: [MailService]
})

export class MailModule {}
