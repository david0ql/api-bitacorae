import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from "class-validator";

export class CreateSessionDto {
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
		description: 'Start date and time of the session (yyyy-MM-dd HH:mm:ss)',
		example: '2025-04-25 10:00:00'
	})
	@IsNotEmpty()
	@IsString()
	@Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, {
		message: 'startDatetime must be in the format yyyy-MM-dd HH:mm:ss',
	})
	readonly startDatetime: string;

	@ApiProperty({
		description: 'End date and time of the session (yyyy-MM-dd HH:mm:ss)',
		example: '2025-04-25 12:00:00'
	})
	@IsNotEmpty()
	@IsString()
	@Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/, {
		message: 'endDatetime must be in the format yyyy-MM-dd HH:mm:ss',
	})
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
