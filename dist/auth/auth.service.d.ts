import { FhirService } from '../fhir/fhir.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ConfigService } from '@nestjs/config';
export declare class AuthService {
    private readonly fhir;
    private readonly config;
    private cognito;
    private cognitoClientId;
    private cognitoUserPoolId;
    private idVerifier;
    constructor(fhir: FhirService, config: ConfigService);
    register(dto: RegisterDto): Promise<{
        token: string;
        user: {
            id: string;
            role: "DOCTOR" | "PATIENT";
            email: string;
            firstName: string;
            lastName: string;
            fhirRef: string | undefined;
        };
    }>;
    login(dto: LoginDto): Promise<{
        token: string;
        user: any;
    }>;
    me(identifier: string): Promise<any>;
    meWithClaims(claims: any): Promise<{
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
    updateNames(identifier: string, firstName?: string, lastName?: string): Promise<any>;
    private authenticateWithCognito;
    private throwCognitoHttpError;
    private createFhirPatient;
    private createFhirDoctor;
    private addUserToGroupSafe;
    private getRoleFromClaims;
    private ensureFhirForIdentifier;
    private lookupFhirBySub;
}
