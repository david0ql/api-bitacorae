import { ApiProperty } from "@nestjs/swagger"
import { IsString } from "class-validator"

export class CreatePostCategoryDto {
	@ApiProperty({
		description: 'The name of the post category',
		example: 'example',
	})
	@IsString()
	readonly name: string
}
