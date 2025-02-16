import { PartialType } from '@nestjs/swagger';
import { CreateConsultorTypeDto } from './create-consultor-type.dto';

export class UpdateConsultorTypeDto extends PartialType(CreateConsultorTypeDto) {}
