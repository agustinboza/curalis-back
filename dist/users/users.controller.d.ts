import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    getProfile(req: any): Promise<any>;
    updateProfile(req: any, dto: UpdateProfileDto): Promise<any>;
    listPatients(): Promise<{
        success: boolean;
        data: any[];
    }>;
    deleteLegacyPatients(): Promise<{
        success: boolean;
        data: {
            removed: number;
        };
    }>;
    listClinicians(): Promise<{
        success: boolean;
        data: {
            id: any;
            email: string;
            firstName: string;
            lastName: string;
            role: string;
        }[];
    }>;
}
