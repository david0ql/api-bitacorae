import { PartialType } from '@nestjs/swagger';
import { CreateBusinessSizeDto } from './create-business-size.dto';

export class UpdateBusinessSizeDto extends PartialType(CreateBusinessSizeDto) {}
