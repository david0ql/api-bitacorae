import { Module } from '@nestjs/common';
import { EducationLevelService } from './education-level.service';
import { EducationLevelController } from './education-level.controller';

@Module({
  controllers: [EducationLevelController],
  providers: [EducationLevelService],
})
export class EducationLevelModule {}
