import { ApiProperty } from "@nestjs/swagger"
import { ArrayNotEmpty, IsArray, IsNumber, IsOptional, IsString } from "class-validator"

export class CreatePostDto {
	@ApiProperty({
		description: 'The title of the post',
		example: 'example',
	})
	@IsString()
	readonly title: string;

	@ApiProperty({
		description: 'The url of the associated image',
		example: 'http://example.com/image.jpg',
	})
	@IsString()
	@IsOptional()
	readonly image: string;

	@ApiProperty({
		description: 'The content of the post',
		example: 'example',
	})
	@IsString()
	readonly content: string;

	@ApiProperty({
		description: 'The categories associated with the post',
		example: [1, 2],
	})
	@IsArray()
	@ArrayNotEmpty()
	@IsNumber({}, { each: true })
	readonly categories: number[];

	@ApiProperty({
		description: 'The date of the post',
		example: '2021-07-01T00:00:00.000Z',
	})
	@IsString()
	readonly postDate: string;
}
