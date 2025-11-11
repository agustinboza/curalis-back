import { Body, Controller, Delete, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { Roles, Role } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { SetWorkingHoursDto } from './dto/set-working-hours.dto.js';
import { CreateBlockedTimeDto } from './dto/create-blocked-time.dto.js';

@Controller('appointments')
@UseGuards(AuthGuard('cognito'), RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // Optional booking alias for client compatibility
  @Post('book')
  @Roles(Role.DOCTOR)
  book(@Body() dto: any) {
    // accept either start/end or startTime/durationMinutes
    if (dto.start && dto.end && dto.patientId && dto.practitionerId) {
      return this.appointmentsService.create(dto as CreateAppointmentDto).then((data) => ({ success: true, data }));
    }
    const start: string = dto.startTime;
    const durationMinutes: number = Number(dto.durationMinutes ?? 30);
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return this.appointmentsService.create({
      patientId: dto.patientId,
      practitionerId: dto.doctorId ?? dto.practitionerId,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }).then((data) => ({ success: true, data }));
  }

  @Post()
  @Roles(Role.DOCTOR)
  create(@Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(dto).then((data) => ({ success: true, data }));
  }

  @Post(':id/checkin')
  @Roles(Role.DOCTOR)
  startCheckIn(@Param('id') id: string) {
    return this.appointmentsService.startCheckInAsync(id).then((data) => ({ success: true, data }));
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.appointmentsService.getById(id).then((data) => ({ success: true, data }));
  }

  @Get(':id/required-exams')
  getRequiredExams(@Param('id') id: string) {
    return this.appointmentsService.getRequiredExams(id).then((data) => ({ success: true, data }));
  }

  @Get('me')
  me(@Request() req: any) {
    const roles: string[] = req.user?.roles ?? [];
    const fhirRef: string | undefined = req.user?.fhirRef;
    if (!fhirRef) return { success: true, data: [] };
    return this.appointmentsService.listForParticipant(fhirRef).then((data) => ({ success: true, data }));
  }

  @Get('doctors/:id/availability')
  getAvailability(
    @Param('id') practitionerId: string,
    @Query('date') date: string,
    @Query('slotMinutes') slotMinutes?: string,
  ) {
    const minutes = Number(slotMinutes ?? 30);
    return this.appointmentsService.getAvailability(practitionerId, date, minutes).then((data) => ({ success: true, data }));
  }

  @Get('working-hours')
  getWorkingHours(@Query('doctorId') doctorId?: string, @Request() req?: any) {
    const practitionerId = doctorId || (req?.user?.fhirRef?.startsWith('Practitioner/') ? req.user.fhirRef.split('/')[1] : undefined);
    if (!practitionerId) return { success: true, data: { hours: [] } } as any;
    return this.appointmentsService.getWorkingHours(practitionerId).then((data) => ({ success: true, data }));
  }

  @Post('working-hours')
  @Roles(Role.DOCTOR)
  setWorkingHours(@Body() dto: SetWorkingHoursDto, @Request() req: any) {
    const practitionerId = dto.doctorId || (req?.user?.fhirRef?.startsWith('Practitioner/') ? req.user.fhirRef.split('/')[1] : undefined);
    return this.appointmentsService.setWorkingHours(practitionerId!, dto).then((data) => ({ success: true, data }));
  }

  @Get('blocked')
  listBlocked(@Query('doctorId') doctorId?: string, @Request() req?: any) {
    const practitionerId = doctorId || (req?.user?.fhirRef?.startsWith('Practitioner/') ? req.user.fhirRef.split('/')[1] : undefined);
    if (!practitionerId) return { success: true, data: [] } as any;
    return this.appointmentsService.listBlocked(practitionerId).then((data) => ({ success: true, data }));
  }

  @Post('blocked')
  @Roles(Role.DOCTOR)
  createBlocked(@Body() dto: CreateBlockedTimeDto, @Request() req: any) {
    const practitionerId = dto.doctorId || (req?.user?.fhirRef?.startsWith('Practitioner/') ? req.user.fhirRef.split('/')[1] : undefined);
    return this.appointmentsService.createBlocked(practitionerId!, dto).then((data) => ({ success: true, data }));
  }

  @Delete('blocked/:id')
  @Roles(Role.DOCTOR)
  deleteBlocked(@Param('id') id: string) {
    return this.appointmentsService.deleteBlocked(id).then(() => ({ success: true }));
  }
}

