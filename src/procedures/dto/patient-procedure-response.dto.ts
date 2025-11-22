import { ExamResultResponseDto } from './exam-result-response.dto.js';

export class PatientProcedureExamDto {
  id!: string;
  examName!: string;
  type!: 'blood_test' | 'imaging' | 'other';
  status!: string;
  dueDate?: string;
  uploadedAt?: string;
  fileName?: string;
  aiProcessed!: boolean;
  extractedData?: Record<string, any>;
}

export class PatientProcedureResponseDto {
  id!: string;
  name!: string;
  description?: string;
  status!: string;
  assignedDate!: string;
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  progress!: number;
  totalExams!: number;
  completedExams!: number;
  exams!: PatientProcedureExamDto[];
}

