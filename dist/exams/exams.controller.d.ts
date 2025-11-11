import { ExamsService } from './exams.service.js';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto.js';
import { UpdateExamTemplateDto } from './dto/update-exam-template.dto.js';
import { AssignExamDto } from './dto/assign-exam.dto.js';
import { UpdateAssignedExamStatusDto } from './dto/update-assigned-exam-status.dto.js';
import { UploadExamResultDto } from './dto/upload-exam-result.dto.js';
export declare class ExamsController {
    private readonly exams;
    constructor(exams: ExamsService);
    listTemplates(procedureTemplateId?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    createTemplate(dto: CreateExamTemplateDto): Promise<{
        success: boolean;
        data: any;
    }>;
    getTemplate(id: string): Promise<{
        success: boolean;
        data: unknown;
    }>;
    updateTemplate(id: string, dto: UpdateExamTemplateDto): Promise<{
        success: boolean;
        data: any;
    }>;
    deleteTemplate(id: string): Promise<{
        success: boolean;
    }>;
    linkToProcedure(examTemplateId: string, procedureTemplateId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    unlinkFromProcedure(examTemplateId: string, procedureTemplateId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    assign(dto: AssignExamDto): Promise<{
        success: boolean;
        data: any;
    }>;
    listAssigned(patientId?: string, carePlanId?: string, status?: string): Promise<{
        success: boolean;
        data: any[];
    }>;
    getAssigned(id: string): Promise<{
        success: boolean;
        data: {
            id: any;
            patientId: string | undefined;
            assignedProcedureId: string | undefined;
            examTemplate: {
                id: string | undefined;
                name: any;
                type: any;
            };
            status: string;
            prescriptionUrl: undefined;
            results: any;
            dueDate: any;
        };
    }>;
    updateAssignedStatus(id: string, dto: UpdateAssignedExamStatusDto): Promise<{
        success: boolean;
        data: {
            id: any;
            patientId: string | undefined;
            assignedProcedureId: string | undefined;
            examTemplate: {
                id: string | undefined;
                name: any;
                type: any;
            };
            status: string;
            prescriptionUrl: undefined;
            results: any;
            dueDate: any;
        };
    }>;
    uploadResult(id: string, dto: UploadExamResultDto): Promise<{
        success: boolean;
        data: any;
    }>;
}
