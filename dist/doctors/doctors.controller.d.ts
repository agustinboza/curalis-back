import { DoctorsService } from './doctors.service.js';
import { CreateDoctorDto } from './dto/create-doctor.dto';
export declare class DoctorsController {
    private readonly doctorsService;
    constructor(doctorsService: DoctorsService);
    createDoctor(dto: CreateDoctorDto): Promise<{
        practitioner: {
            resourceType: string;
            name: {
                family: string;
                given: string[];
            }[];
        };
        role: {
            resourceType: string;
            practitioner: {
                reference: string;
            };
            organization: {
                reference: string;
            };
            specialty: {
                coding: {
                    system: string;
                    code: string;
                    display: string;
                }[];
            }[] | undefined;
        };
    }>;
    getSchedule(practitionerId: string): Promise<unknown>;
}
