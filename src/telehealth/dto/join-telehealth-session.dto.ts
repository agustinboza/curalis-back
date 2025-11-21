import { IsOptional, IsString } from 'class-validator';

export class JoinTelehealthSessionDto {
  @IsOptional()
  @IsString()
  externalUserId?: string;
}
