import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service.js';
import { CreatePatientDto } from './dto/create-patient.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles, Role } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('patients')
@UseGuards(AuthGuard('cognito'), RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles(Role.DOCTOR)
  create(@Body() dto: CreatePatientDto) {
    return this.patientsService.create(dto);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.patientsService.getById(id);
  }

  @Get(':id/overview')
  @Roles(Role.DOCTOR)
  getOverview(@Param('id') id: string) {
    return this.patientsService.getOverview(id).then((data) => ({ success: true, data }));
  }

  @Get(':id/follow-ups')
  @Roles(Role.DOCTOR)
  getFollowUps(@Param('id') id: string) {
    return this.patientsService.getFollowUps(id).then((data) => ({ success: true, data }));
  }

  @Get()
  @Roles(Role.DOCTOR)
  async listPatients() {
    const data = await this.patientsService.listPatients();
    return { success: true, data };
  }
}
