import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBusinessDto } from './create-business.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateBusinessDto extends PartialType(CreateBusinessDto) {
	@ApiProperty({
		description: 'Active status',
		example: 1,
	})
	@IsNumber()
	@IsOptional()
	readonly active: number
}
