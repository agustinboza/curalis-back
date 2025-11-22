import { ExamResultResponseDto } from './exam-result-response.dto.js';

export class AssignedProcedureDetailResponseDto {
  id!: string;
  name!: string;
  description?: string;
  status!: string;
  assignedDate!: string;
  progress!: number;
  totalExams!: number;
  completedExams!: number;
  examResults!: ExamResultResponseDto[];
}

