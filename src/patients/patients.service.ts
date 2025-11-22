import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreatePatientDto } from './dto/create-patient.dto';
import { PatientOverviewResponseDto } from './dto/patient-overview-response.dto.js';
import { FollowUpResponseDto } from './dto/follow-up-response.dto.js';

@Injectable()
export class PatientsService {
  constructor(private readonly fhir: FhirService) {}

  async create(dto: CreatePatientDto) {
    const patient = {
      resourceType: 'Patient',
      name: [{ use: 'official', family: dto.lastName, given: [dto.firstName] }],
      gender: dto.gender,
      birthDate: dto.birthDate,
      telecom: dto.phone ? [{ system: 'phone', value: dto.phone }] : undefined,
    };
    return this.fhir.create('Patient', patient);
  }

  getById(id: string) {
    return this.fhir.read('Patient', id);
  }

  async getOverview(id: string): Promise<PatientOverviewResponseDto> {
    const patient: any = await this.fhir.read('Patient', id);
    
    // Extract name
    const nameObj = patient.name?.[0] || {};
    const firstName = nameObj.given?.[0] || '';
    const lastName = nameObj.family || '';
    const name = `${firstName} ${lastName}`.trim() || 'Unknown';
    
    // Extract email
    const email = patient.telecom?.find((t: any) => t.system === 'email')?.value || '';
    
    // Determine status
    const hasCognitoSub = patient.identifier?.some((id: any) => id.system === 'cognito:user-sub' && id.value);
    const status: 'active' | 'inactive' = hasCognitoSub && email ? 'active' : 'inactive';
    
    // Count procedures
    let totalProcedures = 0;
    let activeProcedures = 0;
    try {
      const carePlanBundle: any = await this.fhir.search('CarePlan', { subject: `Patient/${id}` });
      const carePlans = (carePlanBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
      totalProcedures = carePlans.length;
      activeProcedures = carePlans.filter((cp: any) => cp.status === 'active').length;
    } catch (error) {
      console.error(`Error counting procedures for patient ${id}:`, error);
    }
    
    // Count follow-ups (mock for now - will be 0)
    const totalFollowUps = 0;
    
    return {
      id: patient.id,
      name,
      email,
      status,
      lastVisit: undefined, // TODO: Calculate from appointments if needed
      totalProcedures,
      activeProcedures,
      totalFollowUps,
      weight: undefined, // TODO: Extract from observations if available
      height: undefined, // TODO: Extract from observations if available
    };
  }

  async getFollowUps(id: string): Promise<FollowUpResponseDto[]> {
    // Mock data for now
    return [
      {
        id: 'mock-1',
        type: 'Weight Check',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        weight: undefined,
        wellnessScore: undefined,
      },
      {
        id: 'mock-2',
        type: 'Wellness Assessment',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        weight: undefined,
        wellnessScore: undefined,
      },
    ];
  }
}
