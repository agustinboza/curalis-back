import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateExamTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  defaultDueDays?: number;
}


