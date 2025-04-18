import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class ApprovedSessiontDto {
	@ApiProperty({
		description: 'Signature of the user',
		example: 'John Doe'
	})
	@IsNotEmpty()
	@IsString()
	readonly signature: string;
}
