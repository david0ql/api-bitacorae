import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateChatDto {
	@ApiProperty({
		description: "Session ID to associate with the chat message",
		example: 2,
	})
	@IsNotEmpty()
	@IsNumber()
	readonly sessionId: number;

	@ApiProperty({
		description: "The message content",
		example: "Hello, how can I help you?",
	})
	@IsNotEmpty()
	@IsString()
	readonly message: string;
}
