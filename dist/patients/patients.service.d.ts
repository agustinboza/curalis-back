import { FhirService } from '../fhir/fhir.service.js';
import { CreatePatientDto } from './dto/create-patient.dto';
export declare class PatientsService {
    private readonly fhir;
    constructor(fhir: FhirService);
    create(dto: CreatePatientDto): Promise<{
        resourceType: string;
        name: {
            use: string;
            family: string;
            given: string[];
        }[];
        gender: "male" | "female" | "other" | "unknown";
        birthDate: string;
        telecom: {
            system: string;
            value: string;
        }[] | undefined;
    }>;
    getById(id: string): Promise<unknown>;
}
