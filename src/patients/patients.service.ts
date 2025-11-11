import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreatePatientDto } from './dto/create-patient.dto';

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
}
