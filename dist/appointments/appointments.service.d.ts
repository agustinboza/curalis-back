import { FhirService } from '../fhir/fhir.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto.js';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto.js';
export declare class AppointmentsService {
    private readonly fhir;
    constructor(fhir: FhirService);
    create(dto: CreateAppointmentDto): Promise<{
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
    }>;
    startCheckIn(appointmentId: string): any;
    startCheckInAsync(appointmentId: string): Promise<{
        id: any;
        patientId: any;
        doctorId: any;
        start: any;
        end: any;
        status: any;
        checkInAt: string;
        encounterId: any;
    }>;
    getById(id: string): Promise<unknown>;
    listForParticipant(participantRef: string): Promise<any>;
    getWorkingHours(practitionerId: string): Promise<{
        schedule: any;
        hours: any[];
    }>;
    setWorkingHours(practitionerId: string, dto: SetWorkingHoursDto): Promise<any>;
    listBlocked(practitionerId: string): Promise<any>;
    createBlocked(practitionerId: string, dto: CreateBlockedTimeDto): Promise<any>;
    deleteBlocked(slotId: string): Promise<void>;
    getAvailability(practitionerId: string, date: string, slotMinutes: number): Promise<{
        start: string;
        end: string;
    }[]>;
    getRequiredExams(appointmentId: string): Promise<any>;
}
