import { Module } from '@nestjs/common';
import { ContactInformationService } from './contact-information.service';
import { ContactInformationController } from './contact-information.controller';

@Module({
  controllers: [ContactInformationController],
  providers: [ContactInformationService],
})
export class ContactInformationModule {}
