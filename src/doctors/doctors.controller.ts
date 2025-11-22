import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service.js';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles, Role } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('doctors')
@UseGuards(AuthGuard('cognito'), RolesGuard)
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Post()
  @Roles(Role.DOCTOR)
  createDoctor(@Body() dto: CreateDoctorDto) {
    return this.doctorsService.createDoctor(dto);
  }

  @Get(':id/schedule')
  getSchedule(@Param('id') practitionerId: string) {
    return this.doctorsService.getSchedule(practitionerId);
  }

  @Get()
  async listClinicians() {
    const data = await this.doctorsService.listClinicians();
    return { success: true, data };
  }
}


