import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { AuthService } from '../auth/auth.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { PatientResponseDto } from './dto/patient-response.dto.js';
import { ProfileStatsResponseDto } from './dto/profile-stats-response.dto.js';

@Injectable()
export class UsersService {
  constructor(private readonly fhir: FhirService, private readonly auth: AuthService) {}

  getProfile(identifier: string) {
    return this.auth.me(identifier);
  }

  async updateProfile(identifier: string, fhirRef: string, dto: UpdateProfileDto) {
    const updated = await this.auth.updateNames(identifier, dto.firstName, dto.lastName);
    // Update FHIR primary name as well
    if (fhirRef) {
      const [resourceType, id] = fhirRef.split('/');
      const resource: any = await this.fhir.read<any>(resourceType, id);
      const nextName = {
        family: dto.lastName ?? resource?.name?.[0]?.family,
        given: [dto.firstName ?? resource?.name?.[0]?.given?.[0]].filter(Boolean),
      };
      const next = {
        ...resource,
        name: [nextName],
      };
      await this.fhir.update(resourceType, id, next);
    }
    return updated;
  }

  private pickEmail(telecom?: Array<{ system?: string; value?: string }>): string | undefined {
    return telecom?.find((t) => t.system === 'email')?.value;
  }

  async listPatients(): Promise<PatientResponseDto[]> {
    const bundle: any = await this.fhir.search('Patient', {});
    const resources: any[] = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const withSub = resources.filter((p: any) => (p?.identifier || []).some((id: any) => id?.system === 'cognito:user-sub' && id?.value));
    
    // Transform to structured DTOs with active procedures count
    return Promise.all(
      withSub.map(async (patient: any): Promise<PatientResponseDto> => {
        // Extract name
        const nameObj = patient.name?.[0] || {};
        const firstName = nameObj.given?.[0] || '';
        const lastName = nameObj.family || '';
        const name = `${firstName} ${lastName}`.trim() || 'Unknown';
        
        // Extract email
        const email = this.pickEmail(patient.telecom) || '';
        
        // Determine status
        const hasCognitoSub = patient.identifier?.some((id: any) => id.system === 'cognito:user-sub' && id.value);
        const status: 'active' | 'inactive' = hasCognitoSub && email ? 'active' : 'inactive';
        
        // Count active procedures (CarePlans with status='active')
        let activeProcedures = 0;
        try {
          const carePlanBundle: any = await this.fhir.search('CarePlan', { subject: `Patient/${patient.id}`, status: 'active' });
          activeProcedures = (carePlanBundle?.entry ?? []).length;
        } catch (error) {
          console.error(`Error counting active procedures for patient ${patient.id}:`, error);
        }
        
        return {
          id: patient.id,
          name,
          email,
          status,
          lastVisit: undefined, // TODO: Calculate from appointments if needed
          activeProcedures,
          nextFollowUp: undefined, // TODO: Calculate from follow-ups if needed
        };
      })
    );
  }

  async listClinicians() {
    const bundle: any = await this.fhir.search('Practitioner', {});
    const resources: any[] = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const withSub = resources.filter((pr: any) => (pr?.identifier || []).some((id: any) => id?.system === 'cognito:user-sub' && id?.value));
    return withSub.map((pr: any) => {
      const name = pr?.name?.[0] || {};
      return {
        id: pr.id,
        email: this.pickEmail(pr.telecom) || '',
        firstName: (name.given?.[0] as string) || '',
        lastName: (name.family as string) || '',
        role: 'DOCTOR',
      };
    });
  }

  async deleteLegacyPatients(): Promise<number> {
    const bundle: any = await this.fhir.search('Patient', {});
    const resources: any[] = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const legacy = resources.filter((p: any) => !((p?.identifier || []).some((id: any) => id?.system === 'cognito:user-sub' && id?.value)));
    let removed = 0;
    for (const p of legacy) {
      try {
        await this.fhir.delete('Patient', p.id);
        removed++;
      } catch {
        // ignore deletion failures for now
      }
    }
    return removed;
  }

  async getProfileStats(): Promise<ProfileStatsResponseDto> {
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


