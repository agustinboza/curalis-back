import { FhirService } from '../fhir/fhir.service.js';
import { AuthService } from '../auth/auth.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
export declare class UsersService {
    private readonly fhir;
    private readonly auth;
    constructor(fhir: FhirService, auth: AuthService);
    getProfile(identifier: string): Promise<any>;
    updateProfile(identifier: string, fhirRef: string, dto: UpdateProfileDto): Promise<any>;
    private pickEmail;
    listPatients(): Promise<any[]>;
    listClinicians(): Promise<{
        id: any;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    }[]>;
    deleteLegacyPatients(): Promise<number>;
}
