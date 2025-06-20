import { PartialType } from '@nestjs/swagger';
import { CreateAuditorDto } from './create-auditor.dto';

export class UpdateAuditorDto extends PartialType(CreateAuditorDto) {}
