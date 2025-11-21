import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        token: string;
        user: {
            id: string;
            role: "DOCTOR" | "PATIENT";
            email: string;
            firstName: string;
            lastName: string;
            fhirRef: string;
        };
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        user: any;
    }>;
    me(req: any): Promise<{
        id: string;
        role: "DOCTOR" | "PATIENT";
        email: string | undefined;
        phoneNumber: string | undefined;
        birthdate: any;
        gender: any;
        emailVerified: any;
        firstName: string;
        lastName: string;
        fhirRef: string;
        roles: string[];
    }>;
}
