import { PartialType } from '@nestjs/swagger';
import { CreateStrengtheningAreaDto } from './create-strengthening-area.dto';

export class UpdateStrengtheningAreaDto extends PartialType(CreateStrengtheningAreaDto) {}
