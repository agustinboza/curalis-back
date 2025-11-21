import { FhirService } from '../fhir/fhir.service.js';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto.js';
import { UpdateExamTemplateDto } from './dto/update-exam-template.dto.js';
import { AssignExamDto } from './dto/assign-exam.dto.js';
import { UpdateAssignedExamStatusDto } from './dto/update-assigned-exam-status.dto.js';
import { UploadExamResultDto } from './dto/upload-exam-result.dto.js';
export declare class ExamsService {
    private readonly fhir;
    constructor(fhir: FhirService);
    listTemplates(procedureTemplateId?: string): Promise<any>;
    private createTimingDuration;
    private createCodeCoding;
    createTemplate(dto: CreateExamTemplateDto): Promise<any>;
    getTemplate(id: string): Promise<unknown>;
    updateTemplate(id: string, dto: UpdateExamTemplateDto): Promise<any>;
    deleteTemplate(id: string): Promise<void>;
    linkTemplateToProcedure(examTemplateId: string, procedureTemplateId: string): Promise<any>;
    unlinkTemplateFromProcedure(examTemplateId: string, procedureTemplateId: string): Promise<any>;
    assignExam(dto: AssignExamDto): Promise<any>;
    listAssigned(filters: {
        patientId?: string;
        carePlanId?: string;
        status?: string;
    }): Promise<any>;
    getAssignedById(id: string): Promise<unknown>;
    updateAssignedStatus(id: string, dto: UpdateAssignedExamStatusDto): Promise<any>;
    uploadResult(serviceRequestId: string, dto: UploadExamResultDto): Promise<any>;
    private mapClientStatusToFhir;
}
