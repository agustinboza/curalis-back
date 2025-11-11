import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreateClinicDto } from './dto/create-clinic.dto';

@Injectable()
export class ClinicsService {
  constructor(private readonly fhir: FhirService) {}

  async createClinic(dto: CreateClinicDto) {
    const org = {
      resourceType: 'Organization',
      name: dto.name,
      type: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/organization-type', code: 'prov', display: 'Healthcare Provider' }] }],
    };
    return this.fhir.create('Organization', org);
  }

  async listDepartments(clinicId: string) {
    // Departments are Organizations with partOf reference set to the clinic
    return this.fhir.search('Organization', { partof: clinicId });
  }
}
