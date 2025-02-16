import { PartialType } from '@nestjs/swagger';
import { CreateProductoStatusDto } from './create-producto-status.dto';

export class UpdateProductoStatusDto extends PartialType(CreateProductoStatusDto) {}
