import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBusinessDto } from './create-business.dto';
import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
	@ApiProperty({
		description: 'Active status',
		example: 1,
		required: false
	})
	@Type(() => Number)
	@IsNumber()
	@IsOptional()
	readonly active: number
}
