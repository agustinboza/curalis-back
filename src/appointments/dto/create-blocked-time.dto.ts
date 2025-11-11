import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBlockedTimeDto {
  @IsISO8601()
  startTime!: string; // ISO date-time

  @IsISO8601()
  endTime!: string; // ISO date-time

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;
}


