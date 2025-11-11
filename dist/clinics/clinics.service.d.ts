import { FhirService } from '../fhir/fhir.service.js';
import { CreateClinicDto } from './dto/create-clinic.dto';
export declare class ClinicsService {
    private readonly fhir;
    constructor(fhir: FhirService);
    createClinic(dto: CreateClinicDto): Promise<{
        resourceType: string;
        name: string;
        type: {
            coding: {
                system: string;
                code: string;
                display: string;
            }[];
        }[];
    }>;
    listDepartments(clinicId: string): Promise<unknown>;
}
