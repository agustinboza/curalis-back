import { Module } from '@nestjs/common';
import { FhirModule } from '../fhir/fhir.module.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CheckinController } from './checkin.controller.js';
import { CheckinService } from './checkin.service.js';

@Module({
  imports: [FhirModule],
  controllers: [CheckinController],
  providers: [CheckinService, RolesGuard],
})
export class CheckinModule {}


