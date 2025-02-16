import { PartialType } from '@nestjs/swagger';
import { CreateMarketScopeDto } from './create-market-scope.dto';

export class UpdateMarketScopeDto extends PartialType(CreateMarketScopeDto) {}
