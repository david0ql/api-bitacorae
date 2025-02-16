import { Injectable } from '@nestjs/common';
import { CreateProductoStatusDto } from './dto/create-producto-status.dto';
import { UpdateProductoStatusDto } from './dto/update-producto-status.dto';

@Injectable()
export class ProductoStatusService {
  create(createProductoStatusDto: CreateProductoStatusDto) {
    return 'This action adds a new productoStatus';
  }

  findAll() {
    return `This action returns all productoStatus`;
  }

  findOne(id: number) {
    return `This action returns a #${id} productoStatus`;
  }

  update(id: number, updateProductoStatusDto: UpdateProductoStatusDto) {
    return `This action updates a #${id} productoStatus`;
  }

  remove(id: number) {
    return `This action removes a #${id} productoStatus`;
  }
}
