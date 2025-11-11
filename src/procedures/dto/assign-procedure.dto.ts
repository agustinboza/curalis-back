import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignProcedureDto {
  @IsString()
  @IsNotEmpty()
  templateId!: string; // PlanDefinition id

  @IsString()
  @IsNotEmpty()
  patientId!: string; // Patient id

  @IsOptional()
  @IsString()
  careTeamId?: string; // CareTeam id

  @IsOptional()
  @IsString()
  title?: string; // CarePlan title override
}


