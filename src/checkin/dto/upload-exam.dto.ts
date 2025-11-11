import { IsOptional, IsString } from 'class-validator';

export class UploadExamDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  contentType?: string;

  @IsString()
  url!: string; // temporary: pre-uploaded URL; S3 integration to replace
}


