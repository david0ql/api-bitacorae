import { ApiProperty } from "@nestjs/swagger"
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
	@IsNumber()
	readonly sessionId: number;

	@ApiProperty({
		description: 'External path of the session attachment',
		example: 'https://example.com/file.pdf',
	})
	@IsOptional()
	@IsString()
	readonly externalPath?: string
}
