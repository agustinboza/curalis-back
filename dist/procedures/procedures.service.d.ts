import { FhirService } from '../fhir/fhir.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { AssignProcedureDto } from './dto/assign-procedure.dto.js';
import { VersionCarePlanDto } from './dto/version-careplan.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
export declare class ProceduresService {
    private readonly fhir;
    constructor(fhir: FhirService);
    private mapActions;
    createTemplate(dto: CreateTemplateDto): Promise<any>;
    listTemplates(): Promise<any>;
    getTemplate(id: string): Promise<unknown>;
    updateTemplate(id: string, dto: UpdateTemplateDto): Promise<any>;
    deleteTemplate(id: string): Promise<void>;
    assignToPatient(dto: AssignProcedureDto, authorRef?: string): Promise<any>;
    getCarePlanById(id: string): Promise<unknown>;
    listAssigned(filters: {
        patientId?: string;
        status?: string;
    }): Promise<any>;
    versionCarePlan(oldCarePlanId: string, dto: VersionCarePlanDto): Promise<any>;
}
