import { ApiProperty, PartialType } from '@nestjs/swagger'
import { CreateExpertDto } from './create-expert.dto'
import { IsNumber, IsOptional, ValidateIf } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateExpertDto extends PartialType(CreateExpertDto) {
	@ApiProperty({
		description: 'Active status',
		example: 1,
		required: false
	})
	@IsOptional()
	@ValidateIf(value => value !== null)
	@Type(() => Number)
	@IsNumber()
	readonly active: number
}
