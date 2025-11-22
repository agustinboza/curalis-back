import { Module } from '@nestjs/common';
import { DoctorProfileController } from './doctor-profile.controller.js';
import { DoctorProfileService } from './doctor-profile.service.js';
import { FhirModule } from '../../fhir/fhir.module.js';

@Module({
  imports: [FhirModule],
  controllers: [DoctorProfileController],
  providers: [DoctorProfileService],
  exports: [DoctorProfileService],
})
export class DoctorProfileModule {}

