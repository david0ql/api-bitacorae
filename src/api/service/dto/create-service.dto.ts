import { ApiProperty } from "@nestjs/swagger"
import { IsNumber, IsString } from "class-validator"

export class CreateServiceDto {
	@ApiProperty({
		description: 'The name of the service',
		example: 'example',
	})
	@IsString()
	readonly name: string

	@ApiProperty({
		description: 'The level of the service',
		example: 1,
	})
	@IsNumber()
	readonly level: number
}
