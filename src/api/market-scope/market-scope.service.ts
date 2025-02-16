import { Injectable } from '@nestjs/common';
import { CreateMarketScopeDto } from './dto/create-market-scope.dto';
import { UpdateMarketScopeDto } from './dto/update-market-scope.dto';

@Injectable()
export class MarketScopeService {
  create(createMarketScopeDto: CreateMarketScopeDto) {
    return 'This action adds a new marketScope';
  }

  findAll() {
    return `This action returns all marketScope`;
  }

  findOne(id: number) {
    return `This action returns a #${id} marketScope`;
  }

  update(id: number, updateMarketScopeDto: UpdateMarketScopeDto) {
    return `This action updates a #${id} marketScope`;
  }

  remove(id: number) {
    return `This action removes a #${id} marketScope`;
  }
}
