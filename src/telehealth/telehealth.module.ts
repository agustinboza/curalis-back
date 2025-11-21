import { Module } from '@nestjs/common';
import { TelehealthService } from './telehealth.service.js';
import { TelehealthController } from './telehealth.controller.js';
import { FhirModule } from '../fhir/fhir.module.js';

@Module({
  imports: [FhirModule],
  controllers: [TelehealthController],
  providers: [TelehealthService],
})
export class TelehealthModule { }
