export class ExamResultResponseDto {
  id!: string;
  examName!: string;
  type!: 'blood_test' | 'imaging' | 'other';
  status!: string;
  uploadedAt?: string;
  fileName?: string;
  aiProcessed!: boolean;
  extractedData?: Record<string, any>;
}

