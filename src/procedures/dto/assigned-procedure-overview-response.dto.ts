export class AssignedProcedureOverviewResponseDto {
  id!: string;
  name!: string;
  description?: string;
  status!: string;
  assignedDate!: string;
  progress!: number;
  totalExams!: number;
  completedExams!: number;
}

