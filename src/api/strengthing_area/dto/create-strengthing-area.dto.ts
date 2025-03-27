import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, IsString } from "class-validator"

export class CreateStrengthingAreaDto {
	@ApiProperty({
		description: 'The name of the Strengthing Area',
		example: 'example',
	})
	@IsString()
	readonly name: string

	@ApiProperty({
		description: 'The level of the Strengthing Area',
		example: 1,
	})
	@IsNumber()
	readonly level: number
}
