import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto.js';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto.js';

@Injectable()
export class AppointmentsService {
  constructor(private readonly fhir: FhirService) {}

  create(dto: CreateAppointmentDto) {
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

  startCheckIn(appointmentId: string) {
    // Will be overridden by async version below
    return { appointmentId, checkIn: 'started' } as any;
  }

  async startCheckInAsync(appointmentId: string) {
    const appt: any = await this.fhir.read('Appointment', appointmentId);
    const nowIso = new Date().toISOString();
    // Create Encounter linked to appointment
    const encounter: any = await this.fhir.create('Encounter', {
      resourceType: 'Encounter',
      status: 'in-progress',
      basedOn: [{ reference: `Appointment/${appointmentId}` }],
      subject: appt?.participant?.find((p: any) => (p.actor?.reference || '').startsWith('Patient/'))?.actor,
      participant: appt?.participant,
      period: { start: nowIso },
    });
    // Update appointment status to arrived
    const updatedAppt: any = await this.fhir.update('Appointment', appointmentId, { ...appt, status: 'arrived' });
    return {
      id: updatedAppt.id,
      patientId: updatedAppt.participant?.find((p: any) => (p.actor?.reference || '').startsWith('Patient/'))?.actor?.reference?.split('/')[1],
      doctorId: updatedAppt.participant?.find((p: any) => (p.actor?.reference || '').startsWith('Practitioner/'))?.actor?.reference?.split('/')[1],
      start: updatedAppt.start,
      end: updatedAppt.end,
      status: updatedAppt.status,
      checkInAt: nowIso,
      encounterId: encounter?.id,
    };
  }

  getById(id: string) {
    return this.fhir.read('Appointment', id);
  }

  async listForParticipant(participantRef: string) {
    const bundle: any = await this.fhir.search('Appointment', { participant: participantRef });
    return (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
  }

  async getWorkingHours(practitionerId: string) {
    const schedulesBundle: any = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
    const schedules = (schedulesBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const latest = schedules[0];
    let hours: any[] = [];
    try {
      hours = latest?.comment ? JSON.parse(latest.comment) : [];
    } catch {
      hours = [];
    }
    return { schedule: latest, hours };
  }

  async setWorkingHours(practitionerId: string, dto: SetWorkingHoursDto) {
    const schedulesBundle: any = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
    const schedules = (schedulesBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const serialized = JSON.stringify(dto.hours ?? []);
    if (schedules.length === 0) {
      const schedule: any = {
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

  async listBlocked(practitionerId: string) {
    const schedulesBundle: any = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
    const schedules = (schedulesBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    if (schedules.length === 0) return [];
    const scheduleId = schedules[0].id;
    const bundle: any = await this.fhir.search('Slot', { schedule: `Schedule/${scheduleId}`, status: 'busy' });
    return (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
  }

  async createBlocked(practitionerId: string, dto: CreateBlockedTimeDto) {
    // Ensure a schedule exists
    const schedulesBundle: any = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
    let schedule = (schedulesBundle?.entry ?? []).map((e: any) => e.resource)[0];
    if (!schedule) {
      schedule = await this.fhir.create('Schedule', {
        resourceType: 'Schedule',
        actor: [{ reference: `Practitioner/${practitionerId}` }],
      });
    }
    const slot: any = {
      resourceType: 'Slot',
      schedule: { reference: `Schedule/${schedule.id}` },
      status: 'busy',
      start: dto.startTime,
      end: dto.endTime,
    };
    return this.fhir.create('Slot', slot);
  }

  deleteBlocked(slotId: string) {
    return this.fhir.delete('Slot', slotId);
  }

  async getAvailability(practitionerId: string, date: string, slotMinutes: number) {
    // Derive availability from working hours (Schedule.comment JSON) minus busy Slots
    const { hours } = await this.getWorkingHours(practitionerId);
    const dayIndex = new Date(date + 'T00:00:00Z').getUTCDay();
    const dayKeyMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const dayKey = dayKeyMap[dayIndex];
    const dayHours: Array<{ dayOfWeek: string; startMinutes: number; endMinutes: number }> = (hours || []).filter(
      (h: any) => h.dayOfWeek === dayKey,
    );

    // Fetch busy slots for the day
    const schedulesBundle: any = await this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
    const schedule = (schedulesBundle?.entry ?? []).map((e: any) => e.resource)[0];
    let busy: Array<{ start: Date; end: Date }> = [];
    if (schedule?.id) {
      const startOfDay = new Date(date + 'T00:00:00Z');
      const endOfDay = new Date(startOfDay);
      endOfDay.setUTCDate(startOfDay.getUTCDate() + 1);
      const bundle: any = await this.fhir.search('Slot', {
        schedule: `Schedule/${schedule.id}`,
        status: 'busy',
        start: startOfDay.toISOString(),
        end: endOfDay.toISOString(),
      } as any);
      busy = (bundle?.entry ?? [])
        .map((e: any) => e.resource)
        .filter(Boolean)
        .map((s: any) => ({ start: new Date(s.start), end: new Date(s.end) }));
    }

    const slots: Array<{ start: string; end: string }> = [];
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

  async getRequiredExams(appointmentId: string) {
    const bundle: any = await this.fhir.search('ServiceRequest', {
      'supporting-info': `Appointment/${appointmentId}`,
    } as any);
    return (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
  }
}

