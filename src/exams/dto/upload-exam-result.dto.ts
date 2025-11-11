import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadExamResultDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  patientId?: string; // optional override if not resolvable from ServiceRequest
}


