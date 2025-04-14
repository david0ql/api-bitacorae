import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator"

export class CreatePostDto {
	@ApiProperty({
		description: 'The title of the post',
		example: 'example',
	})
	@IsString()
	readonly title: string;

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
	@Transform(({ value }) => {
		try {
			if (typeof value === 'string') return value.split(',').map(Number);
			return value;
		} catch {
			return [];
		}
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
	@IsNotEmpty()
	readonly postDate: string;

	@ApiProperty({
		type: 'string',
		format: 'binary',
		required: false
	})
  	file?: any
}
