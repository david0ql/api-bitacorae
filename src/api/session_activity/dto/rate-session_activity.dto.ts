import { ApiProperty } from '@nestjs/swagger'
import { IsNumber, Min, Max } from 'class-validator'

export class RateSessionActivityDto {
	@ApiProperty({
		description: 'Calificación del entregable (0 a 100)',
		example: 85
	})
	@IsNumber()
	@Min(0)
	@Max(100)
	readonly grade: number
}
