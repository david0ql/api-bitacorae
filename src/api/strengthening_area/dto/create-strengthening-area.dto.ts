import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, IsString } from "class-validator"

export class CreateStrengtheningAreaDto {
	@ApiProperty({
		description: 'The name of the Strengthening Area',
		example: 'example',
	})
	@IsString()
	readonly name: string

	@ApiProperty({
		description: 'The level of the Strengthening Area',
		example: 1,
	})
	@IsNumber()
	readonly level: number
}
