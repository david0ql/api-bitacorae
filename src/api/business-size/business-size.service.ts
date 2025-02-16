import { Injectable } from '@nestjs/common';
import { CreateBusinessSizeDto } from './dto/create-business-size.dto';
import { UpdateBusinessSizeDto } from './dto/update-business-size.dto';

@Injectable()
export class BusinessSizeService {
  create(createBusinessSizeDto: CreateBusinessSizeDto) {
    return 'This action adds a new businessSize';
  }

  findAll() {
    return `This action returns all businessSize`;
  }

  findOne(id: number) {
    return `This action returns a #${id} businessSize`;
  }

  update(id: number, updateBusinessSizeDto: UpdateBusinessSizeDto) {
    return `This action updates a #${id} businessSize`;
  }

  remove(id: number) {
    return `This action removes a #${id} businessSize`;
  }
}
