import { ApiProperty } from "@nestjs/swagger"
import { IsDateString, IsNotEmpty, IsNumber, IsString } from "class-validator"

export class CreateCohortDto {
	@ApiProperty({
		description: 'Name of the cohort',
		example: 'example',
	})
	@IsString()
	readonly name: string

	@ApiProperty({
		description: 'Order of the cohort',
		example: 1,
	})
	@IsNumber()
	readonly order: number

	@ApiProperty({
		description: 'Fecha de inicio',
		example: '2021-01-01',
	})
	@IsNotEmpty()
	@IsDateString()
	readonly startDate: string

	@ApiProperty({
		description: 'Fecha de fin',
		example: '2021-01-01',
	})
	@IsNotEmpty()
	@IsDateString()
	readonly endDate: string
}
