import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSessionDto } from './create-session.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSessionDto extends PartialType(CreateSessionDto) {
	@ApiProperty({
		description: 'Session notes',
		example: 'These are the session notes',
		required: false
	})
	@IsOptional()
	@IsString()
	readonly sessionNotes?: string;

	@ApiProperty({
		description: 'Conclusions and commitments from the session',
		example: 'These are the conclusions and commitments',
		required: false
	})
	@IsOptional()
	@IsString()
	readonly conclusionsCommitments?: string;
}
