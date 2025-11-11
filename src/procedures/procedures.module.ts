import { Module } from '@nestjs/common';
import { FhirModule } from '../fhir/fhir.module.js';
import { ProceduresController } from './procedures.controller';
import { ProceduresService } from './procedures.service';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Module({
  imports: [FhirModule],
  controllers: [ProceduresController],
  providers: [ProceduresService, RolesGuard],
})
export class ProceduresModule {}


