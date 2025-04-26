import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class ApprovedSessionDto {
	@ApiProperty({
		description: 'Signature of the user',
		example: 'John Doe'
	})
	@IsNotEmpty()
	@IsString()
	readonly signature: string;

	@ApiProperty({
		description: 'Status of the session',
		example: true
	})
	@IsNotEmpty()
	@IsBoolean()
	readonly status: boolean;
}
