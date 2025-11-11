export declare class CreatePatientDto {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female' | 'other' | 'unknown';
    birthDate: string;
    phone?: string;
}
