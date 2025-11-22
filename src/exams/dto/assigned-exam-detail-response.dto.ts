export class AssignedExamDetailResponseDto {
  id!: string;
  examName!: string;
  description?: string;
  type!: 'blood_test' | 'imaging' | 'other';
  status!: string;
  dueDate?: string;
  uploadedResults?: Array<{
    id: string;
    uploadedAt: string;
    fileUrl: string;
    fileName: string;
    fileType: string;
    aiProcessed: boolean;
    extractedData?: Record<string, any>;
  }>;
  prescriptionUrl?: string;
}

