import { Module } from '@nestjs/common';
import { FhirModule } from '../fhir/fhir.module.js';
import { ClinicsController } from './clinics.controller.js';
import { ClinicsService } from './clinics.service.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  imports: [FhirModule],
  controllers: [ClinicsController],
  providers: [ClinicsService, RolesGuard],
})
export class ClinicsModule {}
