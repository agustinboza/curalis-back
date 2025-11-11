import { CheckinService } from './checkin.service.js';
import { UploadExamDto } from './dto/upload-exam.dto.js';
import { AiInterviewDto } from './dto/ai-interview.dto.js';
export declare class CheckinController {
    private readonly checkinService;
    constructor(checkinService: CheckinService);
    uploadExam(dto: UploadExamDto): Promise<any>;
    aiInterview(dto: AiInterviewDto): Promise<any>;
}
