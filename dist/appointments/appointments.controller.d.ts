import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto.js';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto.js';
export declare class AppointmentsController {
    private readonly appointmentsService;
    constructor(appointmentsService: AppointmentsService);
    book(dto: any): Promise<{
        success: boolean;
        data: {
            resourceType: string;
            status: string;
            start: string;
            end: string;
            participant: {
                actor: {
                    reference: string;
                };
                status: string;
            }[];
        };
    }>;
    create(dto: CreateAppointmentDto): Promise<{
        success: boolean;
        data: {
            resourceType: string;
            status: string;
            start: string;
            end: string;
            participant: {
                actor: {
                    reference: string;
                };
                status: string;
            }[];
        };
    }>;
    startCheckIn(id: string): Promise<{
        success: boolean;
        data: {
            id: any;
            patientId: any;
            doctorId: any;
            start: any;
            end: any;
            status: any;
            checkInAt: string;
            encounterId: any;
        };
    }>;
    getById(id: string): Promise<{
        success: boolean;
        data: unknown;
    }>;
    getRequiredExams(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    me(req: any): Promise<{
        success: boolean;
        data: any;
    }> | {
        success: boolean;
        data: never[];
    };
    getAvailability(practitionerId: string, date: string, slotMinutes?: string): Promise<{
        success: boolean;
        data: {
            start: string;
            end: string;
        }[];
    }>;
    getWorkingHours(doctorId?: string, req?: any): any;
    setWorkingHours(dto: SetWorkingHoursDto, req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    listBlocked(doctorId?: string, req?: any): any;
    createBlocked(dto: CreateBlockedTimeDto, req: any): Promise<{
        success: boolean;
        data: any;
    }>;
    deleteBlocked(id: string): Promise<{
        success: boolean;
    }>;
}
