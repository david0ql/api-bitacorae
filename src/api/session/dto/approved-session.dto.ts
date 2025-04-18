import { ApiProperty } from "@nestjs/swagger";

export class ApprovedSessiontDto {
	@ApiProperty({
		type: 'string',
		format: 'binary',
		required: true
	})
  	file: any
}
