import { Module } from '@nestjs/common';
import { FhirModule } from '../fhir/fhir.module.js';
import { PatientsController } from './patients.controller.js';
import { PatientsService } from './patients.service.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { PatientProfileModule } from './profile/patient-profile.module.js';

@Module({
  imports: [FhirModule, PatientProfileModule],
  controllers: [PatientsController],
  providers: [PatientsService, RolesGuard],
})
export class PatientsModule {}
