import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator';

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsIn(['male', 'female', 'other', 'unknown'])
  gender!: 'male' | 'female' | 'other' | 'unknown';

  @IsDateString()
  birthDate!: string; // YYYY-MM-DD

  @IsOptional()
  @IsPhoneNumber()
  phone?: string;
}

