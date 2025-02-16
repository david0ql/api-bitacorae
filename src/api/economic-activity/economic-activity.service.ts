import { Injectable } from '@nestjs/common';
import { CreateEconomicActivityDto } from './dto/create-economic-activity.dto';
import { UpdateEconomicActivityDto } from './dto/update-economic-activity.dto';

@Injectable()
export class EconomicActivityService {
  create(createEconomicActivityDto: CreateEconomicActivityDto) {
    return 'This action adds a new economicActivity';
  }

  findAll() {
    return `This action returns all economicActivity`;
  }

  findOne(id: number) {
    return `This action returns a #${id} economicActivity`;
  }

  update(id: number, updateEconomicActivityDto: UpdateEconomicActivityDto) {
    return `This action updates a #${id} economicActivity`;
  }

  remove(id: number) {
    return `This action removes a #${id} economicActivity`;
  }
}
