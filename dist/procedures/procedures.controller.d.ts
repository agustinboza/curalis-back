import { ProceduresService } from './procedures.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { AssignProcedureDto } from './dto/assign-procedure.dto.js';
import { VersionCarePlanDto } from './dto/version-careplan.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
export declare class ProceduresController {
    private readonly proceduresService;
    constructor(proceduresService: ProceduresService);
    listTemplates(): Promise<{
        success: boolean;
        data: any;
    }>;
    createTemplate(dto: CreateTemplateDto): Promise<{
        success: boolean;
        data: any;
    }>;
    getTemplate(id: string): Promise<{
        success: boolean;
        data: unknown;
    }>;
    updateTemplate(id: string, dto: UpdateTemplateDto): Promise<{
        success: boolean;
        data: any;
    }>;
    deleteTemplate(id: string): Promise<{
        success: boolean;
    }>;
    assignToPatient(dto: AssignProcedureDto, req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    listAssigned(patientId?: string, status?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getAssignedProcedure(id: string): Promise<{
        success: boolean;
        data: unknown;
    }>;
    myProcedures(req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    getMyProcedure(id: string): Promise<{
        success: boolean;
        data: unknown;
    }>;
    versionCarePlan(id: string, dto: VersionCarePlanDto): Promise<{
        success: boolean;
        data: any;
    }>;
}
