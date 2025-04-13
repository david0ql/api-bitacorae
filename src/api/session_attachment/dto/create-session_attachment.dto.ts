import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateSessionAttachmentDto {
	@ApiProperty({
		description: 'Name of the session attachment',
		example: 'example',
	})
	@IsNotEmpty()
	@IsString()
	readonly name: string

	@ApiProperty({
		description: "Session ID to associate with the attachment",
		example: 2,
	})
	@IsNotEmpty()
	@Type(() => Number)
	@IsNumber()
	readonly sessionId: number;

	@ApiProperty({
		description: 'External path of the session attachment',
		example: 'https://example.com/file.pdf',
		required: false,
	})
	@IsOptional()
	@IsString()
	readonly externalPath?: string

	@ApiProperty({
		type: 'string',
		format: 'binary',
		required: false
	})
  	file?: any
}
