import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateBusinessDto {
	@ApiProperty({
		description: 'Name of the business',
		example: 'business example'
	})
	@IsNotEmpty()
	@IsString()
	readonly socialReason: string

	@ApiProperty({
		description: 'Document type ID',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly documentTypeId: number

	@ApiProperty({
		description: 'Document number',
		example: '123456789'
	})
	@IsNotEmpty()
	@IsString()
	readonly documentNumber: string

	@ApiProperty({
		description: 'Address of the business',
		example: 'cr 1 # 2 - 3'
	})
	@IsNotEmpty()
	@IsString()
	readonly address: string

	@ApiProperty({
		description: 'Phone number',
		example: '1234567890'
	})
	@IsNotEmpty()
	@IsString()
	readonly phone: string

	@ApiProperty({
		description: 'Email address',
		example: 'example@example.com'
	})
	@IsNotEmpty()
	@IsString()
	readonly email: string

	@ApiProperty({
		description: 'Economic activity ID',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly economicActivityId: number

	@ApiProperty({
		description: 'Economic activity ID',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly businessSizeId: number

	@ApiProperty({
		description: 'Number of employees',
		example: 10
	})
	@IsNotEmpty()
	@IsNumber()
	readonly numberOfEmployees: number

	@ApiProperty({
		description: 'Last year sales',
		example: 1000000
	})
	@IsNotEmpty()
	@IsNumber()
	readonly lastYearSales: number

	@ApiProperty({
		description: 'Two years ago sales',
		example: 1000000
	})
	@IsNotEmpty()
	@IsNumber()
	readonly twoYearsAgoSales: number

	@ApiProperty({
		description: 'Three years ago sales',
		example: 1000000
	})
	@IsNotEmpty()
	@IsNumber()
	readonly threeYearsAgoSales: number

	@ApiProperty({
		description: 'Facebook profile URL',
		example: 'http://facebook.com/example'
	})
	@IsString()
	@IsOptional()
	readonly facebook: string

	@ApiProperty({
		description: 'Instagram profile URL',
		example: 'http://instagram.com/example'
	})
	@IsString()
	@IsOptional()
	readonly instagram: string

	@ApiProperty({
		description: 'Twitter profile URL',
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
		description: 'LinkedIn profile URL',
		example: 'http://linkedin.com/in/example'
	})
	@IsString()
	@IsOptional()
	readonly linkedin: string

	@ApiProperty({
		description: 'The ID of the position within the business',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly positionId: number

	@ApiProperty({
		description: 'Has the business been founded before',
		example: true
	})
	@IsBoolean()
	@IsOptional()
	readonly hasFoundedBefore: boolean

	@ApiProperty({
		description: 'Observation',
		example: 'This is an observation'
	})
	@IsString()
	@IsOptional()
	readonly observation: string

	@ApiProperty({
		description: 'Number of people leading the business',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly numberOfPeopleLeading: number

	@ApiProperty({
		description: 'Product status ID',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly productStatusId: number

	@ApiProperty({
		description: 'Market scope ID',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly marketScopeId: number

	@ApiProperty({
		description: 'Business plan',
		example: 'This is a business plan'
	})
	@IsString()
	@IsOptional()
	readonly businessPlan: string

	@ApiProperty({
		description: 'Business segmentation',
		example: 'This is a business segmentation'
	})
	@IsString()
	@IsOptional()
	readonly businessSegmentation: string

	@ApiProperty({
		description: 'Strengthing area ID',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly strengthingAreaId: number

	@ApiProperty({
		description: 'Assigned hours',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly assignedHours: number

	@ApiProperty({
		description: 'Cohort ID',
		example: 1
	})
	@IsNotEmpty()
	@IsNumber()
	readonly cohortId: number

	@ApiProperty({
		description: 'Diagnostic',
		example: 'This is a diagnostic'
	})
	@IsString()
	@IsOptional()
	readonly diagnostic: string

	@ApiProperty({
		description: 'Evidence',
		example: 'This is an evidence'
	})
	@IsString()
	@IsOptional()
	readonly evidence: string

	@ApiProperty({
		description: 'Password',
		example: 'example'
	})
	@IsString()
	@IsNotEmpty()
	readonly password: string
}
