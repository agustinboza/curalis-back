import { Module } from '@nestjs/common';
import { PatientProfileController } from './patient-profile.controller.js';
import { PatientProfileService } from './patient-profile.service.js';
import { FhirModule } from '../../fhir/fhir.module.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  imports: [FhirModule, AuthModule],
  controllers: [PatientProfileController],
  providers: [PatientProfileService],
  exports: [PatientProfileService],
})
export class PatientProfileModule {}

