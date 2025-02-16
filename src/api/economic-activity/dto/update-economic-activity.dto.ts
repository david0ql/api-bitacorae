import { PartialType } from '@nestjs/swagger';
import { CreateEconomicActivityDto } from './create-economic-activity.dto';

export class UpdateEconomicActivityDto extends PartialType(CreateEconomicActivityDto) {}
