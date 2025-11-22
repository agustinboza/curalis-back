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
}


