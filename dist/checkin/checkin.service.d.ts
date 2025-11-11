import { FhirService } from '../fhir/fhir.service.js';
import { UploadExamDto } from './dto/upload-exam.dto.js';
import { AiInterviewDto } from './dto/ai-interview.dto.js';
export declare class CheckinService {
    private readonly fhir;
    constructor(fhir: FhirService);
    uploadExam(dto: UploadExamDto): Promise<any>;
    saveInterview(dto: AiInterviewDto): Promise<any>;
}
