import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { AuthService } from '../auth/auth.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

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

  async listPatients() {
    const bundle: any = await this.fhir.search('Patient', {});
    const resources: any[] = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const withSub = resources.filter((p: any) => (p?.identifier || []).some((id: any) => id?.system === 'cognito:user-sub' && id?.value));
    return withSub.map((p: any) => {
      const name = p?.name?.[0] || {};
      return {
        id: p.id,
        email: this.pickEmail(p.telecom) || '',
        firstName: (name.given?.[0] as string) || '',
        lastName: (name.family as string) || '',
        role: 'PATIENT',
        consentStatus: { digitalSignature: false, emailVerified: !!this.pickEmail(p.telecom), isComplete: true },
        emailVerified: !!this.pickEmail(p.telecom),
        weight: 0,
        height: 0,
        comorbidConditions: [],
      };
    });
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
}


