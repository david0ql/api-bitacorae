import { Injectable } from '@nestjs/common';
import { CreateContactInformationDto } from './dto/create-contact-information.dto';
import { UpdateContactInformationDto } from './dto/update-contact-information.dto';

@Injectable()
export class ContactInformationService {
  create(createContactInformationDto: CreateContactInformationDto) {
    return 'This action adds a new contactInformation';
  }

  findAll() {
    return `This action returns all contactInformation`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contactInformation`;
  }

  update(id: number, updateContactInformationDto: UpdateContactInformationDto) {
    return `This action updates a #${id} contactInformation`;
  }

  remove(id: number) {
    return `This action removes a #${id} contactInformation`;
  }
}
