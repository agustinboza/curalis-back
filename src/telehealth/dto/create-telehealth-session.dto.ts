import { IsOptional, IsString } from 'class-validator';

export class CreateTelehealthSessionDto {
  @IsOptional()
  @IsString()
  mediaRegion?: string;

  @IsOptional()
  @IsString()
  doctorExternalUserId?: string;
}
