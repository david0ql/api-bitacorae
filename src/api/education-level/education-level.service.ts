import { Injectable } from '@nestjs/common';
import { CreateEducationLevelDto } from './dto/create-education-level.dto';
import { UpdateEducationLevelDto } from './dto/update-education-level.dto';

@Injectable()
export class EducationLevelService {
  create(createEducationLevelDto: CreateEducationLevelDto) {
    return 'This action adds a new educationLevel';
  }

  findAll() {
    return `This action returns all educationLevel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} educationLevel`;
  }

  update(id: number, updateEducationLevelDto: UpdateEducationLevelDto) {
    return `This action updates a #${id} educationLevel`;
  }

  remove(id: number) {
    return `This action removes a #${id} educationLevel`;
  }
}
