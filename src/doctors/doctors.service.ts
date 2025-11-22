import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreateDoctorDto } from './dto/create-doctor.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly fhir: FhirService) {}

  async createDoctor(dto: CreateDoctorDto) {
    const practitioner = await this.fhir.create('Practitioner', {
      resourceType: 'Practitioner',
      name: [{ family: dto.lastName, given: [dto.firstName] }],
    });

    // Link to department via PractitionerRole
    const role = await this.fhir.create('PractitionerRole', {
      resourceType: 'PractitionerRole',
      practitioner: { reference: `Practitioner/${(practitioner as any).id}` },
      organization: { reference: `Organization/${dto.departmentId}` },
      specialty: dto.specialty
        ? [
            {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  code: '408443003',
                  display: dto.specialty,
                },
              ],
            },
          ]
        : undefined,
    });

    return { practitioner, role };
  }

  getSchedule(practitionerId: string) {
    // Simple pass-through search for related Schedules/Slots
    return this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
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

  private pickEmail(telecom?: Array<{ system?: string; value?: string }>): string | undefined {
    return telecom?.find((t) => t.system === 'email')?.value;
  }
}


