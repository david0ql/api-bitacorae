import { PartialType } from '@nestjs/swagger';
import { CreateAccompanimentDto } from './create-accompaniment.dto';

export class UpdateAccompanimentDto extends PartialType(CreateAccompanimentDto) {}
