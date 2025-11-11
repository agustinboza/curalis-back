export declare class RegisterDto {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    birthdate: string;
    gender: string;
    password: string;
    role: 'PATIENT' | 'DOCTOR';
    departmentId?: string;
}
