import { ApiProperty } from "@nestjs/swagger"
import { Transform, Type } from "class-transformer"
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from "class-validator"

export class CreateUserDto {
	@ApiProperty({
		description: 'Email address',
		example: 'example@example.com'
	})
	@IsNotEmpty()
	@IsString()
	readonly email: string

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
		description: 'Document type ID',
		example: 1,
		required: false,
		nullable: true
	})
	@IsOptional()
	@ValidateIf(value => value !== null)
	@Type(() => Number)
	@IsNumber()
	readonly documentTypeId: number

	@ApiProperty({
		description: 'Document number',
		example: '123456789',
		required: false
	})
	@IsOptional()
	@IsString()
	readonly documentNumber: string

	@ApiProperty({
		description: 'Phone number',
		example: '1234567890',
		required: false
	})
	@IsString()
	@IsOptional()
	readonly phone: string

	@ApiProperty({
		description: 'Gender ID',
		example: 1,
		required: false,
		nullable: true
	})
	@IsOptional()
	@ValidateIf(value => value !== null)
	@Type(() => Number)
	@IsNumber()
	readonly genderId: number

	@ApiProperty({
		description: 'Education level ID',
		example: 1,
		required: false,
		nullable: true
	})
	@IsOptional()
	@ValidateIf(value => value !== null)
	@Type(() => Number)
	@IsNumber()
	readonly educationLevelId: number

	@ApiProperty({
		description: 'The strengthening areas IDs',
		example: [1, 2],
		required: false
	})
	@Transform(({ value }) => {
		try {
			if (typeof value === 'string') return value.split(',').map(Number)
			return value
		} catch {
			return []
		}
	})
	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@IsNumber({}, { each: true })
	readonly strengtheningAreas?: number[]

	@ApiProperty({
		description: 'Experience years',
		example: 1,
		required: false,
		nullable: true
	})
	@IsOptional()
	@ValidateIf(value => value !== null)
	@Type(() => Number)
	@IsNumber()
	readonly experienceYears: number

	@ApiProperty({
		description: 'Facebook URL',
		example: 'http://facebook.com/example',
		required: false
	})
	@IsString()
	@IsOptional()
	readonly facebook: string

	@ApiProperty({
		description: 'Instagram URL',
		example: 'http://instagram.com/example',
		required: false
	})
	@IsString()
	@IsOptional()
	readonly instagram: string

	@ApiProperty({
		description: 'Twitter URL',
		example: 'http://twitter.com/example',
		required: false
	})
	@IsString()
	@IsOptional()
	readonly twitter: string

	@ApiProperty({
		description: 'Website URL',
		example: 'http://example.com',
		required: false
	})
	@IsString()
	@IsOptional()
	readonly website: string

	@ApiProperty({
		description: 'LinkedIn URL',
		example: 'http://linkedin.com/in/example',
		required: false
	})
	@IsString()
	@IsOptional()
	readonly linkedin: string

	@ApiProperty({
		description: 'Profile',
		example: 'This is an example profile',
		required: false
	})
	@IsString()
	@IsOptional()
	readonly profile: string

	@ApiProperty({
		type: 'string',
		format: 'binary',
		required: false
	})
	file?: any
}
