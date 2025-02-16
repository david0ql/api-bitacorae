import { Module } from '@nestjs/common';
import { CohortService } from './cohort.service';
import { CohortController } from './cohort.controller';

@Module({
  controllers: [CohortController],
  providers: [CohortService],
})
export class CohortModule {}
