export class PatientOverviewResponseDto {
  id!: string;
  name!: string;
  email!: string;
  status!: 'active' | 'inactive';
  lastVisit?: string;
  totalProcedures!: number;
  activeProcedures!: number;
  totalFollowUps!: number;
  weight?: number;
  height?: number;
}

