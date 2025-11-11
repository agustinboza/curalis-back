import { IsArray, IsOptional, IsString } from 'class-validator';

export class AiInterviewDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  questionnaireId?: string; // Questionnaire id

  @IsArray()
  items!: Array<{ linkId: string; text?: string; answer?: Array<{ valueString?: string; valueBoolean?: boolean; valueNumber?: number }> }>;
}


