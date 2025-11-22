export interface ConsentStatus {
  isComplete: boolean;
  signedAt?: string;
}

export class PatientProfileResponseDto {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  role!: 'PATIENT';
  weight?: number;
  height?: number;
  comorbidConditions!: string[];
  consentStatus!: ConsentStatus;
  consentSignedAt?: string;
  emailVerified!: boolean;
  createdAt?: string;
  updatedAt?: string;
}

