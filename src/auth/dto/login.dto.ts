import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier!: string; // email or E.164 phone number

  @IsString()
  @IsNotEmpty()
  password!: string;
}


