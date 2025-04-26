import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsString, Matches } from "class-validator"

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
		description: 'The date of the post (format: yyyy-MM-dd HH:mm:ss)',
		example: '2025-04-30 14:30:00',
	})
	@IsString()
	@IsNotEmpty()
	@Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, {
		message: 'postDate must be in the format yyyy-MM-dd HH:mm:ss'
	})
	readonly postDate: string;

	@ApiProperty({
		type: 'string',
		format: 'binary',
		required: false
	})
  	file?: any
}
