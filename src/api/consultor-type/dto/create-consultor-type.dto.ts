import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, IsString } from "class-validator"

export class CreateConsultorTypeDto {
	@ApiProperty({
		description: 'The name of the consultor type',
		example: 'example',
	})
	@IsString()
	readonly name: string

	@ApiProperty({
		description: 'The role of the consultor type',
		example: 1,
	})
	@IsNumber()
	readonly role: number
}
