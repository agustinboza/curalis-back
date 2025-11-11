import { Module } from '@nestjs/common';
import { FhirModule } from '../fhir/fhir.module.js';
import { ExamsController } from './exams.controller.js';
import { ExamsService } from './exams.service.js';

@Module({
  imports: [FhirModule],
  controllers: [ExamsController],
  providers: [ExamsService],
})
export class ExamsModule {}


