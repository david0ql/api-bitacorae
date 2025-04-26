import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsNumber, IsString, Matches } from "class-validator"

export class CreateCohortDto {
	@ApiProperty({
		description: 'Name of the cohort',
		example: 'example',
	})
	@IsNotEmpty()
	@IsString()
	readonly name: string

	@ApiProperty({
		description: 'Order of the cohort',
		example: 1,
	})
	@IsNotEmpty()
	@IsNumber()
	readonly order: number

	@ApiProperty({
		description: 'Fecha de inicio (yyyy-MM-dd)',
		example: '2021-01-01',
	})
	@IsNotEmpty()
	@IsString()
	@Matches(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'La fecha debe tener el formato yyyy-MM-dd',
	})
	readonly startDate: string

	@ApiProperty({
		description: 'Fecha de fin (yyyy-MM-dd)',
		example: '2021-01-01',
	})
	@IsNotEmpty()
	@IsString()
	@Matches(/^\d{4}-\d{2}-\d{2}$/, {
		message: 'La fecha debe tener el formato yyyy-MM-dd',
	})
	readonly endDate: string
}
