import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateContactInformationDto {
	@ApiProperty({
		description: 'Business ID',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly businessId: number

	@ApiProperty({
		description: 'The first name of the contact',
		example: 'John'
	})
	@IsNotEmpty()
	@IsString()
	readonly firstName: string

	@ApiProperty({
		description: 'The last name of the contact',
		example: 'Doe'
	})
	@IsNotEmpty()
	@IsString()
	readonly lastName: string

	@ApiProperty({
		description: 'Email address',
		example: 'example@example.com'
	})
	@IsNotEmpty()
	@IsString()
	readonly email: string

	@ApiProperty({
		description: 'Phone number',
		example: '1234567890'
	})
	@IsString()
	@IsOptional()
	readonly phone: string

	@ApiProperty({
		description: 'Document type ID',
		example: 1
	})
	@IsOptional()
	@IsNumber()
	readonly documentTypeId: number

	@ApiProperty({
		description: 'Document number',
		example: '123456789'
	})
	@IsOptional()
	@IsString()
	readonly documentNumber: string

	@ApiProperty({
		description: 'Photo URL',
		example: 'http://example.com/photo.jpg'
	})
	@IsString()
	@IsOptional()
	readonly photo: string;

	@ApiProperty({
		description: 'Gender ID',
		example: 1
	})
	@IsOptional()
	@IsNumber()
	readonly genderId: number

	@ApiProperty({
		description: 'Experience years',
		example: 1
	})
	@IsOptional()
	@IsNumber()
	readonly experienceYears: number

	@ApiProperty({
		description: 'Strengthening area ID',
		example: 1
	})
	@IsOptional()
	@IsNumber()
	readonly strengtheningAreaId: number

	@ApiProperty({
		description: 'Education level ID',
		example: 1
	})
	@IsOptional()
	@IsNumber()
	readonly educationLevelId: number

	@ApiProperty({
		description: 'Facebook URL',
		example: 'http://facebook.com/example'
	})
	@IsString()
	@IsOptional()
	readonly facebook: string

	@ApiProperty({
		description: 'Instagram URL',
		example: 'http://instagram.com/example'
	})
	@IsString()
	@IsOptional()
	readonly instagram: string

	@ApiProperty({
		description: 'Twitter URL',
		example: 'http://twitter.com/example'
	})
	@IsString()
	@IsOptional()
	readonly twitter: string

	@ApiProperty({
		description: 'Website URL',
		example: 'http://example.com'
	})
	@IsString()
	@IsOptional()
	readonly website: string

	@ApiProperty({
		description: 'LinkedIn URL',
		example: 'http://linkedin.com/in/example'
	})
	@IsString()
	@IsOptional()
	readonly linkedin: string

	@ApiProperty({
		description: 'Profile',
		example: 'This is an example profile'
	})
	@IsString()
	@IsOptional()
	readonly profile: string
}
