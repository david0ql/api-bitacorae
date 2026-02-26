import { Injectable } from '@nestjs/common'
import { format, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import * as moment from 'moment-timezone'

@Injectable()
export class DateService {
	private static readonly DEFAULT_TIMEZONE = 'America/Bogota'
	/**
	 * Convierte un string `yyyy-MM-dd HH:mm:ss` o un Date a un Date (sin tocar la hora enviada)
	 */
	parseToDate(input: string | Date): Date {
		if (typeof input === 'string') {
			const parsedMoment = moment.tz(input, 'YYYY-MM-DD HH:mm:ss', DateService.DEFAULT_TIMEZONE)
			const parsedDate = parsedMoment.toDate()
			if (!parsedMoment.isValid() || !isValid(parsedDate)) {
				throw new Error(`Fecha inválida: ${input}`)
			}
			return parsedDate
		}

		if (!isValid(input)) {
			throw new Error(`Fecha inválida: ${input}`)
		}

		return input
	}

	/**
	 * Retorna la fecha actual
	 */
	getNow(): Date {
		return new Date()
	}

	/**
	 * Calcula la diferencia en horas entre dos fechas
	 */
	getHoursDiff(start: string | Date, end: string | Date): number {
		const startDate = this.parseToDate(start)
		const endDate = this.parseToDate(end)

		const msDiff = endDate.getTime() - startDate.getTime()
		return Math.floor(msDiff / (1000 * 60 * 60))
	}

	/**
	 * Formatea una fecha tipo "25 abril 2025 a las 10:00 a. m."
	 */
	formatDate(date: Date): string {
		const parsedDate = this.parseToDate(date)
		const bogotaDate = moment(parsedDate).tz(DateService.DEFAULT_TIMEZONE).toDate()
		const sessionDate = format(bogotaDate, 'dd MMMM yyyy', { locale: es })
		const sessionTime = format(bogotaDate, 'hh:mm a', { locale: es })

		return `${sessionDate} a las ${sessionTime}`
	}

	/**
	 * Devuelve la fecha actual ya formateada
	 */
	getFormattedNow(): string {
		return this.formatDate(this.getNow())
	}
}
