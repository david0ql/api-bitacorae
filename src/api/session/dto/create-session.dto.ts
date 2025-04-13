import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateSessiontDto {
	@ApiProperty({
		description: 'Accompaniment ID',
		example: 1
	})
	@IsNotEmpty()
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
		example: 'https://example.com/conference'
	})
	@IsOptional()
	@IsString()
	readonly conferenceLink?: string;

	@ApiProperty({
		description: 'Preparation notes for the session',
		example: 'Prepare the agenda and materials'
	})
	@IsOptional()
	@IsString()
	readonly preparationNotes?: string;
}
