import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNotEmpty, IsString, IsBoolean, Matches, IsNumber } from 'class-validator'

export class CreateSessionActivityDto {
	@ApiProperty({
		description: 'Título de la actividad',
		example: 'Preparar propuesta comercial',
	})
	@IsString()
	@IsNotEmpty()
	readonly title: string

	@ApiProperty({
		description: 'Descripción de la actividad',
		example: 'Debe incluir una propuesta detallada sobre...',
	})
	@IsString()
	@IsNotEmpty()
	readonly description: string

	@ApiProperty({
		description: '¿Requiere entregable?',
		example: true,
	})
	@Type(() => Boolean)
	@IsBoolean()
	readonly requiresDeliverable: boolean

	@ApiProperty({
		description: 'Fecha límite para entregar la actividad (formato yyyy-MM-dd HH:mm:ss)',
		example: '2025-04-30 23:59:59',
	})
	@IsString()
	@Matches(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/, {
		message: 'La fecha debe estar en el formato yyyy-MM-dd HH:mm:ss',
	})
	readonly dueDatetime: string

	@ApiProperty({
		description: 'ID de la sesión a la que pertenece la actividad',
		example: 42,
	})
	@IsNotEmpty()
	@Type(() => Number)
	@IsNumber()
	readonly sessionId: number

	@ApiProperty({
		type: 'string',
		format: 'binary',
		required: false
	})
  	file?: any
}
