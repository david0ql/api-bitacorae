import { Injectable } from '@nestjs/common'
import { MailerService } from '@nestjs-modules/mailer'
import * as fs from 'fs'
import * as path from 'path'
import { tmpdir } from 'os'
import * as sanitizeHtml from 'sanitize-html'
import { createEvent, EventAttributes } from 'ics'
import Handlebars from 'handlebars'

import { WelcomeEmailContext } from './interfaces/welcome-email-context.interface'
import { NewSessionEmailContext } from './interfaces/new-session-email-context.interface'
import { NewSessionActivityEmailContext } from './interfaces/new-session-activity-email-context.interface'
import { EndedSessionEmailContext } from './interfaces/ended-session-email-context.interface'
import { ApprovedSessionEmailContext } from './interfaces/approved-session-email-context.inteface'
import { RespondedSessionEmailContext } from './interfaces/responded-session-email-context.interface'
import { ChangePasswordEmailContext } from './interfaces/change-password-email-context.interface'
import { FileInfo } from '../pdf/interfaces/file-info.interface'
import { Platform } from 'src/entities/Platform'
import { DynamicDatabaseService } from 'src/services/dynamic-database/dynamic-database.service'

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
		webUrl: envVars.WEB_URL,
		logoUrl: `${envVars.APP_URL}/assets/email/logo_bictoria.jpg`,
		notificationEmail: '',
	}

	constructor(
		private readonly mailerService: MailerService,
		private readonly dynamicDbService: DynamicDatabaseService
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

	private async getPlatformVars(businessName: string) {
		console.log('🔧 [MAIL SERVICE] getPlatformVars iniciado para business:', businessName)
		
		if (!businessName) {
			console.log('⚠️ [MAIL SERVICE] getPlatformVars: businessName vacío')
			return
		}

		console.log('🔧 [MAIL SERVICE] Obteniendo conexión a BD...')
		const businessDataSource = await this.dynamicDbService.getBusinessConnection(businessName)
		
		if (!businessDataSource) {
			console.warn(`❌ [MAIL SERVICE] No se pudo conectar a la base de datos de la empresa: ${businessName}`)
			return
		}
		console.log('✅ [MAIL SERVICE] Conexión a BD establecida')

		try {
			const platformRepository = businessDataSource.getRepository(Platform)
			console.log('🔧 [MAIL SERVICE] Buscando configuración de plataforma...')
			const platform = await platformRepository.findOne({ where: {} })
			
			console.log('🔧 [MAIL SERVICE] Configuración de plataforma encontrada:', {
				logoPath: platform?.logoPath,
				programName: platform?.programName,
				notificationEmail: platform?.notificationEmail
			})
			
			if(platform?.logoPath) {
				this.varCommons.logoUrl = `${envVars.APP_URL}/${platform.logoPath}`
				console.log('🔧 [MAIL SERVICE] Logo URL actualizado:', this.varCommons.logoUrl)
			}

			if(platform?.programName) {
				this.varCommons.programName = platform.programName
				console.log('🔧 [MAIL SERVICE] Program name actualizado:', this.varCommons.programName)
			}

			if(platform?.notificationEmail) {
				this.varCommons.notificationEmail = platform.notificationEmail
				console.log('🔧 [MAIL SERVICE] Notification email actualizado:', this.varCommons.notificationEmail)
			}

			console.log('🔧 [MAIL SERVICE] Variables comunes finales:', {
				year: this.varCommons.year,
				companyName: this.varCommons.companyName,
				programName: this.varCommons.programName,
				webUrl: this.varCommons.webUrl,
				logoUrl: this.varCommons.logoUrl,
				notificationEmail: this.varCommons.notificationEmail
			})
		} finally {
			// await this.dynamicDbService.closeBusinessConnection(businessDataSource) // Disabled - connections are now cached
			// console.log('🔒 [MAIL SERVICE] Conexión a BD cerrada')
		}
	}

	private generateCalendarEventFile(event: EventAttributes): string {
		console.log('📅 [MAIL SERVICE] generateCalendarEventFile - Event recibido:', JSON.stringify(event, null, 2))
		
		const { error, value } = createEvent(event)
		
		if (error) {
			console.error('❌ [MAIL SERVICE] Error en createEvent:', error)
			throw new Error(`No se pudo generar el archivo ICS: ${error.message}`)
		}
		
		if (!value) {
			console.error('❌ [MAIL SERVICE] createEvent no retornó valor')
			throw new Error('No se pudo generar el archivo ICS: createEvent no retornó valor')
		}

		console.log('✅ [MAIL SERVICE] createEvent exitoso, valor generado:', value.substring(0, 200) + '...')

		const calendarFilePath = path.join(tmpdir(), `session-${Date.now()}.ics`)
		console.log('📁 [MAIL SERVICE] Escribiendo archivo en:', calendarFilePath)
		
		fs.writeFileSync(calendarFilePath, value)
		console.log('✅ [MAIL SERVICE] Archivo ICS generado exitosamente')
		
		return calendarFilePath
	}

	private formatDateArray(date: Date): [number, number, number, number, number] {
		return [
			date.getFullYear(),
			date.getMonth() + 1,
			date.getDate(),
			date.getHours(),
			date.getMinutes()
		]
	}

	async sendWelcomeEmail(context: WelcomeEmailContext, businessName: string) {
		await this.getPlatformVars(businessName)

		const { name, email, password } = context
		const { notificationEmail } = this.varCommons

		const subject = 'Bienvenido a Bitácora-e'

		await this.mailerService.sendMail({
			to: email,
			...(notificationEmail ? { cc: notificationEmail } : {}),
			subject,
			template: 'create-user',
			context: {
				...this.varCommons,
				title: subject,
				name,
				email,
				password
			}
		})
	}

	async sendNewSessionEmail(context: NewSessionEmailContext, businessName: string, files?: Express.Multer.File[]) {
		console.log('📧 [MAIL SERVICE] Iniciando sendNewSessionEmail')
		console.log('📧 [MAIL SERVICE] Context recibido:', JSON.stringify(context, null, 2))
		console.log('📧 [MAIL SERVICE] Business name (dbName):', businessName)
		console.log('📧 [MAIL SERVICE] Files:', files?.length || 0, 'archivos')

		console.log('📧 [MAIL SERVICE] Obteniendo variables de plataforma...')
		console.log('📧 [MAIL SERVICE] Llamando getPlatformVars con dbName:', businessName)
		await this.getPlatformVars(businessName)
		console.log('📧 [MAIL SERVICE] Variables de plataforma obtenidas')

		const { notificationEmail } = this.varCommons
		const { to, businessName: contextBusinessName, expertName, expertMail, startDate, endDate, sessionDateFormat, conferenceLink, preparationNotes } = context
		const subject = 'Nueva sesión creada'

		console.log('📧 [MAIL SERVICE] Datos extraídos:')
		console.log('  - To:', to)
		console.log('  - Business name:', contextBusinessName)
		console.log('  - Expert name:', expertName)
		console.log('  - Expert mail:', expertMail)
		console.log('  - Notification email:', notificationEmail)
		console.log('  - Subject:', subject)

		// Validar y ajustar fechas para el calendario
		const startDateTime = new Date(startDate)
		let endDateTime = new Date(endDate)
		
		// Si las fechas son iguales, agregar 1 hora a la fecha de fin
		if (startDateTime.getTime() === endDateTime.getTime()) {
			endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000) // +1 hora
			console.log('⚠️ [MAIL SERVICE] Fechas iguales detectadas, ajustando fecha de fin a +1 hora')
		}

		// Validar si conferenceLink es una URL válida
		const isValidUrl = (url: string | undefined): boolean => {
			if (!url) return false
			try {
				new URL(url)
				return true
			} catch {
				return false
			}
		}

		const event: EventAttributes = {
			title: `Sesión con ${expertName}`,
			description: 'Sesión programada',
			start: this.formatDateArray(startDateTime),
			end: this.formatDateArray(endDateTime),
			location: conferenceLink || 'Reunión virtual',
			...(isValidUrl(conferenceLink) && conferenceLink && { url: conferenceLink }),
			status: 'CONFIRMED',
			busyStatus: 'BUSY',
			organizer: { name: expertName, email: expertMail }
		}

		console.log('📅 [MAIL SERVICE] Evento de calendario creado:', JSON.stringify(event, null, 2))

		let calendarFilePath: string = ''

		try {
			console.log('📅 [MAIL SERVICE] Generando archivo de calendario...')
			calendarFilePath = this.generateCalendarEventFile(event)
			console.log('📅 [MAIL SERVICE] Archivo de calendario generado:', calendarFilePath)

			const attachments = [
				...(files?.map(f => ({ filename: f.originalname, path: f.path })) ?? []),
				{ filename: 'session.ics', path: calendarFilePath }
			]

			console.log('📎 [MAIL SERVICE] Adjuntos preparados:', attachments.length, 'archivos')
			attachments.forEach((att, index) => {
				console.log(`  ${index + 1}. ${att.filename} - ${att.path}`)
			})

			const mailOptions = {
				to,
				cc: [notificationEmail, expertMail].filter(Boolean),
				subject,
				template: 'create-session',
				context: {
					...this.varCommons,
					title: subject,
					businessName: contextBusinessName,
					expertName,
					sessionDateFormat,
					conferenceLink,
					preparationNotes
				},
				attachments
			}

			console.log('📧 [MAIL SERVICE] Opciones de correo:')
			console.log('  - To:', mailOptions.to)
			console.log('  - CC:', mailOptions.cc)
			console.log('  - Subject:', mailOptions.subject)
			console.log('  - Template:', mailOptions.template)
			console.log('  - Context keys:', Object.keys(mailOptions.context))
			console.log('  - Attachments:', mailOptions.attachments.length)

			console.log('📧 [MAIL SERVICE] Enviando correo...')
			const result = await this.mailerService.sendMail(mailOptions)
			console.log('✅ [MAIL SERVICE] Correo enviado exitosamente:', result)
			return result
		} catch (error) {
			console.error('❌ [MAIL SERVICE] Error enviando correo:', error)
			console.error('❌ [MAIL SERVICE] Stack trace:', error.stack)
			throw error
		} finally {
			if (calendarFilePath) {
				console.log('🗑️ [MAIL SERVICE] Eliminando archivo temporal:', calendarFilePath)
				fs.promises.unlink(calendarFilePath).catch(err =>
					console.warn('⚠️ [MAIL SERVICE] No se pudo eliminar el archivo temporal:', err)
				)
			}
		}
	}

	async sendNewSessionActivityEmail(context: NewSessionActivityEmailContext, businessName: string, file?: Express.Multer.File) {
		await this.getPlatformVars(businessName)

		const {
			sessionId,
			to,
			businessName: contextBusinessName,
			expertName,
			expertEmail,
			sessionDateTime,
			dueDateTime
		} = context
		const { webUrl, notificationEmail } = this.varCommons

		const subject = 'Nueva actividad de sesión creada'
		const url = `${webUrl}/#/home/accompaniment/updateSession/${sessionId}`

		await this.mailerService.sendMail({
			to,
			cc: [notificationEmail, expertEmail].filter(Boolean),
			subject,
			template: 'create-session-activity',
			context: {
				...this.varCommons,
				title: subject,
				businessName: contextBusinessName,
				expertName,
				sessionDateTime,
				dueDateTime,
				url
			},
			attachments: file ? [{
				filename: file.originalname,
				path: file.path
			}] : []
		})
	}

	async sendRespondedSessionEmail(context: RespondedSessionEmailContext, businessName: string, file?: Express.Multer.File) {
		console.log('📧 [MAIL SERVICE] Iniciando sendRespondedSessionEmail')
		console.log('📧 [MAIL SERVICE] Context recibido:', JSON.stringify(context, null, 2))
		console.log('📧 [MAIL SERVICE] Business name (dbName):', businessName)
		console.log('📧 [MAIL SERVICE] File:', file?.filename || 'ninguno')

		await this.getPlatformVars(businessName)

		const {
			sessionId,
			businessId,
			accompanimentId,
			to,
			businessName: contextBusinessName,
			expertName,
			expertEmail,
			businessEmail,
			sessionDateTime
		} = context
		const { webUrl, notificationEmail } = this.varCommons

		const subject = 'Actividad de sesión respondida'
		const url = `${webUrl}/#/home/accompaniment/detail/${businessId}/${accompanimentId}/updateSession/${sessionId}`

		const recipients = {
			to: to,
			cc: [notificationEmail, businessEmail, expertEmail].filter(Boolean)
		}

		console.log('📧 [MAIL SERVICE] Destinatarios del correo:')
		console.log('📧 [MAIL SERVICE]   - TO:', recipients.to)
		console.log('📧 [MAIL SERVICE]   - CC:', recipients.cc)
		console.log('📧 [MAIL SERVICE]   - notificationEmail:', notificationEmail)
		console.log('📧 [MAIL SERVICE]   - businessEmail:', businessEmail)
		console.log('📧 [MAIL SERVICE]   - expertEmail:', expertEmail)
		console.log('📧 [MAIL SERVICE]   - expertName:', expertName)

		const mailResult = await this.mailerService.sendMail({
			to: recipients.to,
			cc: recipients.cc,
			subject,
			template: 'respond-session-activity',
			context: {
				...this.varCommons,
				title: subject,
				businessName: contextBusinessName,
				expertName,
				sessionDateTime,
				url
			},
			attachments: file ? [{
				filename: file.originalname,
				path: file.path
			}] : []
		})

		console.log('✅ [MAIL SERVICE] Correo de respuesta enviado exitosamente:', mailResult)
	}

	async sendEndedSessionEmail(context: EndedSessionEmailContext, businessName: string) {
		await this.getPlatformVars(businessName)

		const {
			sessionId,
			to,
			businessName: contextBusinessName,
			expertName,
			expertMail,
			sessionDateTime
		} = context
		const { webUrl, notificationEmail } = this.varCommons

		const subject = 'Sesión publicada'
		const url = `${webUrl}/#/home/accompaniment/updateSession/${sessionId}`

		await this.mailerService.sendMail({
			to,
			cc: [notificationEmail, expertMail].filter(Boolean),
			subject,
			template: 'ended-session',
			context: {
				...this.varCommons,
				title: subject,
				businessName: contextBusinessName,
				expertName,
				sessionDateTime,
				url
			}
		})
	}

	async sendApprovedSessionEmailContext(context: ApprovedSessionEmailContext, file: FileInfo, businessName: string) {
		await this.getPlatformVars(businessName)

		const { to, businessName: contextBusinessName } = context
		const { notificationEmail } = this.varCommons

		const subject = 'Sesión aprobada'

		await this.mailerService.sendMail({
			to,
			...(notificationEmail ? { cc: notificationEmail } : {}),
			subject,
			template: 'approved-session',
			context: {
				...this.varCommons,
				title: subject,
				businessName: contextBusinessName
			},
			attachments: [{
				filename: file.fileName,
				path: file.filePath
			}]
		})
	}

	async sendChangePasswordEmail(context: ChangePasswordEmailContext, businessName: string) {
		await this.getPlatformVars(businessName)

		const { name, email, password } = context
		const { notificationEmail } = this.varCommons

		const subject = 'Cambio de contraseña'

		await this.mailerService.sendMail({
			to: email,
			...(notificationEmail ? { cc: notificationEmail } : {}),
			subject,
			template: 'change-password',
			context: {
				...this.varCommons,
				title: subject,
				name,
				email,
				password
			}
		})
	}
}
