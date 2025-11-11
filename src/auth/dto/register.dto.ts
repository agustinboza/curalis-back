import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsISO8601, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  email!: string;

  @Matches(/^\+[1-9]\d{1,14}$/)
  phoneNumber!: string; // E.164 format (+XXXXXXXXXXX)

  @IsISO8601()
  birthdate!: string; // YYYY-MM-DD

  @IsString()
  @IsNotEmpty()
  gender!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsIn(['PATIENT', 'DOCTOR'])
  role!: 'PATIENT' | 'DOCTOR';

  @IsOptional()
  @IsString()
  departmentId?: string; // For doctors
}


