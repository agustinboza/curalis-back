"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentsService = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_js_1 = require("../fhir/fhir.service.js");
let AppointmentsService = class AppointmentsService {
    fhir;
    constructor(fhir) {
        this.fhir = fhir;
    }
    create(dto) {
        const appointment = {
            resourceType: 'Appointment',
            status: 'booked',
            start: dto.start,
            end: dto.end,
            participant: [
                { actor: { reference: `Patient/${dto.patientId}` }, status: 'accepted' },
                { actor: { reference: `Practitioner/${dto.practitionerId}` }, status: 'accepted' },
            ],
        };
        return this.fhir.create('Appointment', appointment);
    }
    startCheckIn(appointmentId) {
        return { appointmentId, checkIn: 'started' };
    }
    async startCheckInAsync(appointmentId) {
        const appt = await this.fhir.read('Appointment', appointmentId);
        const nowIso = new Date().toISOString();
        const encounter = await this.fhir.create('Encounter', {
            resourceType: 'Encounter',
            status: 'in-progress',
            basedOn: [{ reference: `Appointment/${appointmentId}` }],
            subject: appt?.participant?.find((p) => (p.actor?.reference || '').startsWith('Patient/'))?.actor,
            participant: appt?.participant,
            period: { start: nowIso },
        });
        const updatedAppt = await this.fhir.update('Appointment', appointmentId, { ...appt, status: 'arrived' });
        return {
            id: updatedAppt.id,
            patientId: updatedAppt.participant?.find((p) => (p.actor?.reference || '').startsWith('Patient/'))?.actor?.reference?.split('/')[1],
            doctorId: updatedAppt.participant?.find((p) => (p.actor?.reference || '').startsWith('Practitioner/'))?.actor?.reference?.split('/')[1],
            start: updatedAppt.start,
            end: updatedAppt.end,
            status: updatedAppt.status,
            checkInAt: nowIso,
            encounterId: encounter?.id,
        };
    }
    getById(id) {
        return this.fhir.read('Appointment', id);
    }
    async listForParticipant(participantRef) {
        const bundle = await this.fhir.search('Appointment', { participant: participantRef });
        return (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
    }
    async getWorkingHours(practitionerId) {
        const schedulesBundle = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
        const schedules = (schedulesBundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        const latest = schedules[0];
        let hours = [];
        try {
            hours = latest?.comment ? JSON.parse(latest.comment) : [];
        }
        catch {
            hours = [];
        }
        return { schedule: latest, hours };
    }
    async setWorkingHours(practitionerId, dto) {
        const schedulesBundle = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
        const schedules = (schedulesBundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        const serialized = JSON.stringify(dto.hours ?? []);
        if (schedules.length === 0) {
            const schedule = {
                resourceType: 'Schedule',
                actor: [{ reference: `Practitioner/${practitionerId}` }],
                comment: serialized,
            };
            return this.fhir.create('Schedule', schedule);
        }
        const existing = schedules[0];
        const updated = { ...existing, comment: serialized };
        return this.fhir.update('Schedule', existing.id, updated);
    }
    async listBlocked(practitionerId) {
        const schedulesBundle = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
        const schedules = (schedulesBundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        if (schedules.length === 0)
            return [];
        const scheduleId = schedules[0].id;
        const bundle = await this.fhir.search('Slot', { schedule: `Schedule/${scheduleId}`, status: 'busy' });
        return (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
    }
    async createBlocked(practitionerId, dto) {
        const schedulesBundle = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
        let schedule = (schedulesBundle?.entry ?? []).map((e) => e.resource)[0];
        if (!schedule) {
            schedule = await this.fhir.create('Schedule', {
                resourceType: 'Schedule',
                actor: [{ reference: `Practitioner/${practitionerId}` }],
            });
        }
        const slot = {
            resourceType: 'Slot',
            schedule: { reference: `Schedule/${schedule.id}` },
            status: 'busy',
            start: dto.startTime,
            end: dto.endTime,
        };
        return this.fhir.create('Slot', slot);
    }
    deleteBlocked(slotId) {
        return this.fhir.delete('Slot', slotId);
    }
    async getAvailability(practitionerId, date, slotMinutes) {
        const { hours } = await this.getWorkingHours(practitionerId);
        const dayIndex = new Date(date + 'T00:00:00Z').getUTCDay();
        const dayKeyMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const dayKey = dayKeyMap[dayIndex];
        const dayHours = (hours || []).filter((h) => h.dayOfWeek === dayKey);
        const schedulesBundle = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
        const schedule = (schedulesBundle?.entry ?? []).map((e) => e.resource)[0];
        let busy = [];
        if (schedule?.id) {
            const startOfDay = new Date(date + 'T00:00:00Z');
            const endOfDay = new Date(startOfDay);
            endOfDay.setUTCDate(startOfDay.getUTCDate() + 1);
            const bundle = await this.fhir.search('Slot', {
                schedule: `Schedule/${schedule.id}`,
                status: 'busy',
                start: startOfDay.toISOString(),
                end: endOfDay.toISOString(),
            });
            busy = (bundle?.entry ?? [])
                .map((e) => e.resource)
                .filter(Boolean)
                .map((s) => ({ start: new Date(s.start), end: new Date(s.end) }));
        }
        const slots = [];
        for (const wh of dayHours) {
            const base = new Date(date + 'T00:00:00Z');
            const start = new Date(base);
            start.setUTCMinutes(wh.startMinutes);
            const end = new Date(base);
            end.setUTCMinutes(wh.endMinutes);
            for (let t = new Date(start); t < end; t = new Date(t.getTime() + slotMinutes * 60000)) {
                const slotStart = t;
                const slotEnd = new Date(Math.min(t.getTime() + slotMinutes * 60000, end.getTime()));
                const overlapsBusy = busy.some((b) => !(slotEnd <= b.start || slotStart >= b.end));
                if (!overlapsBusy) {
                    slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
                }
            }
        }
        return slots;
    }
    async getRequiredExams(appointmentId) {
        const bundle = await this.fhir.search('ServiceRequest', {
            'supporting-info': `Appointment/${appointmentId}`,
        });
        return (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
    }
};
exports.AppointmentsService = AppointmentsService;
exports.AppointmentsService = AppointmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fhir_service_js_1.FhirService])
], AppointmentsService);
//# sourceMappingURL=appointments.service.js.map