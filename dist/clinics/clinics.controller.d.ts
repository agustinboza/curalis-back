import { ClinicsService } from './clinics.service.js';
import { CreateClinicDto } from './dto/create-clinic.dto';
export declare class ClinicsController {
    private readonly clinicsService;
    constructor(clinicsService: ClinicsService);
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
