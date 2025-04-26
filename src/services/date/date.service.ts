import { Injectable } from '@nestjs/common'
import { format, isValid } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { es } from 'date-fns/locale'

@Injectable()
export class DateService {
	private readonly timeZone = 'America/Bogota'

	/**
	 * Convierte un string `yyyy-MM-dd HH:mm:ss` o un Date a un Date con zona horaria ajustada
	 */
	parseToZonedDate(input: string | Date): Date {
		if (typeof input === 'string') {
			const parsedDate = new Date(input.replace(' ', 'T')) // '2025-04-25 10:00:00' -> '2025-04-25T10:00:00'
			if (!isValid(parsedDate)) {
				throw new Error(`Fecha inválida: ${input}`)
			}
			return toZonedTime(parsedDate, this.timeZone)
		}

		return toZonedTime(input, this.timeZone)
	}

	/**
	 * Retorna la fecha actual en zona horaria Bogotá
	 */
	getNowInTimeZone(): Date {
		return toZonedTime(new Date(), this.timeZone)
	}

	/**
	 * Calcula la diferencia en horas entre dos fechas
	 */
	getHoursDiff(start: string | Date, end: string | Date): number {
		const startDate = this.parseToZonedDate(start)
		const endDate = this.parseToZonedDate(end)

		const msDiff = endDate.getTime() - startDate.getTime()
		return Math.floor(msDiff / (1000 * 60 * 60))
	}

	/**
	 * Formatea una fecha tipo "25 abril 2025 a las 10:00 a. m."
	 */
	formatDate(date: Date): string {
		const zonedDate = toZonedTime(date, this.timeZone)
		const sessionDate = format(zonedDate, 'dd MMMM yyyy', { locale: es })
		const sessionTime = format(zonedDate, 'hh:mm a', { locale: es })

		return `${sessionDate} a las ${sessionTime}`
	}

	/**
	 * Devuelve la fecha actual ya formateada
	 */
	getFormattedNow(): string {
		return this.formatDate(this.getNowInTimeZone())
	}
}
