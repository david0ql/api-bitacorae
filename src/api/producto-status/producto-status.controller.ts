import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProductoStatusService } from './producto-status.service';
import { CreateProductoStatusDto } from './dto/create-producto-status.dto';
import { UpdateProductoStatusDto } from './dto/update-producto-status.dto';

@Controller('producto-status')
export class ProductoStatusController {
  constructor(private readonly productoStatusService: ProductoStatusService) {}

  @Post()
  create(@Body() createProductoStatusDto: CreateProductoStatusDto) {
    return this.productoStatusService.create(createProductoStatusDto);
  }

  @Get()
  findAll() {
    return this.productoStatusService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productoStatusService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProductoStatusDto: UpdateProductoStatusDto) {
    return this.productoStatusService.update(+id, updateProductoStatusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productoStatusService.remove(+id);
  }
}
