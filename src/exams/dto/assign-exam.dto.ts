import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignExamDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string; // Patient id

  @IsString()
  @IsNotEmpty()
  examTemplateId!: string; // ActivityDefinition id

  // Optional links
  @IsOptional()
  @IsString()
  carePlanId?: string; // CarePlan id (aka assignedProcedureId)

  @IsOptional()
  @IsString()
  assignedProcedureId?: string; // alias of carePlanId for compatibility

  @IsOptional()
  @IsString()
  appointmentId?: string; // Appointment id

  @IsOptional()
  @IsDateString()
  dueDate?: string; // ISO date-time

  @IsOptional()
  @IsString()
  notes?: string;
}


