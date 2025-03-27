import { ApiProperty, PartialType } from '@nestjs/swagger'
import { CreateExpertDto } from './create-expert.dto'
import { IsNumber, IsOptional } from 'class-validator'

export class UpdateExpertDto extends PartialType(CreateExpertDto) {
	@ApiProperty({
		description: 'Active status',
		example: 1,
	})
	@IsNumber()
	@IsOptional()
	readonly active: number
}
