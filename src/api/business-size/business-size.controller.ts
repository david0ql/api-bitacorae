import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BusinessSizeService } from './business-size.service';
import { CreateBusinessSizeDto } from './dto/create-business-size.dto';
import { UpdateBusinessSizeDto } from './dto/update-business-size.dto';

@Controller('business-size')
export class BusinessSizeController {
  constructor(private readonly businessSizeService: BusinessSizeService) {}

  @Post()
  create(@Body() createBusinessSizeDto: CreateBusinessSizeDto) {
    return this.businessSizeService.create(createBusinessSizeDto);
  }

  @Get()
  findAll() {
    return this.businessSizeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.businessSizeService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusinessSizeDto: UpdateBusinessSizeDto) {
    return this.businessSizeService.update(+id, updateBusinessSizeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.businessSizeService.remove(+id);
  }
}
