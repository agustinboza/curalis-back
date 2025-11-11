import { IsOptional, IsString } from 'class-validator';

export class VersionCarePlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
