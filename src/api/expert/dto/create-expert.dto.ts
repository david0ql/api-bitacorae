import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class CreateExpertDto {
	@ApiProperty({
		description: 'First name',
		example: 'example',
	})
	@IsNotEmpty()
	@IsString()
	readonly firstName: string

	@ApiProperty({
		description: 'Last name',
		example: 'example',
	})
	@IsNotEmpty()
	@IsString()
	readonly lastName: string

	@ApiProperty({
		description: 'Email address',
		example: 'example@example.com',
	})
	@IsNotEmpty()
	@IsString()
	readonly email: string;

	@ApiProperty({
		description: 'Phone number',
		example: '1234567890',
	})
	@IsNotEmpty()
	@IsString()
	readonly phone: string;

	@ApiProperty({
		description: 'Document type ID',
		example: 1,
	})
	@IsNumber()
	readonly documentTypeId: number;

	@ApiProperty({
		description: 'Document number',
		example: '123456789',
	})
	@IsNotEmpty()
	@IsString()
	readonly documentNumber: string;

	@ApiProperty({
		description: 'Photo URL',
		example: 'http://example.com/photo.jpg',
	})
	@IsString()
	@IsOptional()
	readonly photo: string;

	@ApiProperty({
		description: 'Consultor type ID',
		example: 1,
	})
	@IsNumber()
	readonly consultorTypeId: number;

	@ApiProperty({
		description: 'Gender ID',
		example: 1,
	})
	@IsNumber()
	readonly genderId: number;

	@ApiProperty({
		description: 'Years of experience',
		example: 5,
	})
	@IsNumber()
	@IsOptional()
	readonly experienceYears: number;

	@ApiProperty({
		description: 'Strengthening area ID',
		example: 1,
	})
	@IsNumber()
	readonly strengthingAreaId: number;

	@ApiProperty({
		description: 'Education level ID',
		example: 1,
	})
	@IsNumber()
	readonly educationLevelId: number;

	@ApiProperty({
		description: 'Facebook profile URL',
		example: 'http://facebook.com/example',
	})
	@IsString()
	@IsOptional()
	readonly facebook: string;

	@ApiProperty({
		description: 'Instagram profile URL',
		example: 'http://instagram.com/example',
	})
	@IsString()
	@IsOptional()
	readonly instagram: string;

	@ApiProperty({
		description: 'Twitter profile URL',
		example: 'http://twitter.com/example',
	})
	@IsString()
	@IsOptional()
	readonly twitter: string;

	@ApiProperty({
		description: 'Website URL',
		example: 'http://example.com',
	})
	@IsString()
	@IsOptional()
	readonly website: string;

	@ApiProperty({
		description: 'LinkedIn profile URL',
		example: 'http://linkedin.com/in/example',
	})
	@IsString()
	@IsOptional()
	readonly linkedin: string;

	@ApiProperty({
		description: 'Profile description',
		example: 'This is a sample profile description.',
	})
	@IsString()
	@IsOptional()
	readonly profile: string;

	@ApiProperty({
		description: 'Password',
		example: 'example',
	})
	@IsString()
	@IsNotEmpty()
	readonly password: string;
}
