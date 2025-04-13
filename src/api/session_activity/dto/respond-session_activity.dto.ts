import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty } from 'class-validator'

export class RespondSessionActivityDto {
	@ApiProperty({
		description: 'Descripción del entregable',
		example: 'Se presenta una propuesta con tres opciones de modelo...',
	})
	@IsString()
	@IsNotEmpty()
	readonly deliverableDescription: string
}
