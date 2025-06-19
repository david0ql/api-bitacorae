import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class BusinessAuthDto {
	@ApiProperty({
		description: 'Business ID or document number',
		example: '123456789'
	})
	@IsNotEmpty()
	@IsString()
	readonly companyId: string

	@ApiProperty({
		description: 'Business password',
		example: 'password123'
	})
	@IsNotEmpty()
	@IsString()
	readonly companyPassword: string
} 