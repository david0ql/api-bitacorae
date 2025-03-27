import { PartialType } from '@nestjs/swagger';
import { CreateStrengthingAreaDto } from './create-strengthing-area.dto';

export class UpdateStrengthingAreaDto extends PartialType(CreateStrengthingAreaDto) {}
