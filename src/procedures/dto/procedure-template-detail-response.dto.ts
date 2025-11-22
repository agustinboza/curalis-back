import { ExamTemplateResponseDto } from './exam-template-response.dto.js';

export class ProcedureTemplateDetailResponseDto {
  id!: string;
  title!: string;
  description?: string;
  examTemplates!: ExamTemplateResponseDto[];
}

