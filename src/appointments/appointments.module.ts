import { Module } from '@nestjs/common';
import { FhirModule } from '../fhir/fhir.module.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  imports: [FhirModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, RolesGuard],
})
export class AppointmentsModule {}



