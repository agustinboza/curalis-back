import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateExamTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  type?: string; // e.g., blood_test, imaging, other

  @IsOptional()
  @IsString()
  description?: string;

  // default due in days for assigned exams if not provided explicitly
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultDueDays?: number;
}


