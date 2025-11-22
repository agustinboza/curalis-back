export class PatientResponseDto {
  id!: string;
  name!: string;
  email!: string;
  status!: 'active' | 'inactive';
  lastVisit?: string;
  activeProcedures!: number;
  nextFollowUp?: string;
}

