import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSessiontDto {
	@ApiProperty({
		description: 'Accompaniment ID',
		example: 1
	})
	@IsNotEmpty()
	@Type(() => Number)
	@IsNumber()
	readonly accompanimentId: number;

	@ApiProperty({
		description: 'Title of the session',
		example: 'Session Title'
	})
	@IsNotEmpty()
	@IsString()
	readonly title: string;

	@ApiProperty({
		description: 'Start date and time of the session',
		example: '2023-10-01T10:00:00Z'
	})
	@IsNotEmpty()
	@IsString()
	readonly startDatetime: string;

	@ApiProperty({
		description: 'End date and time of the session',
		example: '2023-10-01T12:00:00Z'
	})
	@IsNotEmpty()
	@IsString()
	readonly endDatetime: string;

	@ApiProperty({
		description: 'Conference link for the session',
		example: 'https://example.com/conference',
		required: false
	})
	@IsOptional()
	@IsString()
	readonly conferenceLink?: string;

	@ApiProperty({
		description: 'Preparation notes for the session',
		example: 'Prepare the agenda and materials',
		required: false
	})
	@IsOptional()
	@IsString()
	readonly preparationNotes?: string;

	@ApiProperty({
		type: 'string',
		format: 'binary',
		isArray: true,
		required: false,
		description: 'Files for session preparation'
	})
  	files?: any;
}
