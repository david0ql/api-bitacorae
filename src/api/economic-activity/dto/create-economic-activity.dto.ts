import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class CreateEconomicActivityDto {
	@ApiProperty({
		description: 'The name of the economic activity',
		example: 'example',
	})
	@IsString()
	readonly name: string
}
