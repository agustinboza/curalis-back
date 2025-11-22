import { Module } from '@nestjs/common';
import { FhirModule } from '../fhir/fhir.module.js';
import { DoctorsController } from './doctors.controller.js';
import { DoctorsService } from './doctors.service.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { DoctorProfileModule } from './profile/doctor-profile.module.js';

@Module({
  imports: [FhirModule, DoctorProfileModule],
  controllers: [DoctorsController],
  providers: [DoctorsService, RolesGuard],
})
export class DoctorsModule {}


