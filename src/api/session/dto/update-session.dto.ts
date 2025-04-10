import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSessiontDto } from './create-session.dto';

export class UpdateSessionDto extends PartialType(CreateSessiontDto) {}
