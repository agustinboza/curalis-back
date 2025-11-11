import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  patientId!: string;

  @IsString()
  @IsNotEmpty()
  practitionerId!: string;

  @IsISO8601()
  start!: string; // ISO date-time

  @IsISO8601()
  end!: string; // ISO date-time
}



