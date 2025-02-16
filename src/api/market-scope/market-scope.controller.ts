import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MarketScopeService } from './market-scope.service';
import { CreateMarketScopeDto } from './dto/create-market-scope.dto';
import { UpdateMarketScopeDto } from './dto/update-market-scope.dto';

@Controller('market-scope')
export class MarketScopeController {
  constructor(private readonly marketScopeService: MarketScopeService) {}

  @Post()
  create(@Body() createMarketScopeDto: CreateMarketScopeDto) {
    return this.marketScopeService.create(createMarketScopeDto);
  }

  @Get()
  findAll() {
    return this.marketScopeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marketScopeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMarketScopeDto: UpdateMarketScopeDto) {
    return this.marketScopeService.update(+id, updateMarketScopeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marketScopeService.remove(+id);
  }
}
