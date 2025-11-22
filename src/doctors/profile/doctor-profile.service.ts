import { Injectable } from '@nestjs/common';
import { FhirService } from '../../fhir/fhir.service.js';
import { DoctorProfileStatsResponseDto } from './dto/doctor-profile-stats-response.dto.js';

@Injectable()
export class DoctorProfileService {
  constructor(private readonly fhir: FhirService) {}

  async getProfileStats(): Promise<DoctorProfileStatsResponseDto> {
    // Count patients (those with cognito identifier)
    const patientsBundle: any = await this.fhir.search('Patient', {});
    const patients: any[] = (patientsBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const patientsWithSub = patients.filter((p: any) => 
      (p?.identifier || []).some((id: any) => id?.system === 'cognito:user-sub' && id?.value)
    );
    const totalPatients = patientsWithSub.length;

    // Count all CarePlans (procedures)
    const carePlansBundle: any = await this.fhir.search('CarePlan', {});
    const carePlans: any[] = (carePlansBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const totalProcedures = carePlans.length;

    // Count active CarePlans
    const activeCarePlansBundle: any = await this.fhir.search('CarePlan', { status: 'active' });
    const activeCarePlans: any[] = (activeCarePlansBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const activeProcedures = activeCarePlans.length;

    return {
      totalPatients,
      totalProcedures,
      activeProcedures,
    };
  }
}

