import { Injectable } from '@nestjs/common';
import { CreateConsultorTypeDto } from './dto/create-consultor-type.dto';
import { UpdateConsultorTypeDto } from './dto/update-consultor-type.dto';

@Injectable()
export class ConsultorTypeService {
  create(createConsultorTypeDto: CreateConsultorTypeDto) {
    return 'This action adds a new consultorType';
  }

  findAll() {
    return `This action returns all consultorType`;
  }

  findOne(id: number) {
    return `This action returns a #${id} consultorType`;
  }

  update(id: number, updateConsultorTypeDto: UpdateConsultorTypeDto) {
    return `This action updates a #${id} consultorType`;
  }

  remove(id: number) {
    return `This action removes a #${id} consultorType`;
  }
}
