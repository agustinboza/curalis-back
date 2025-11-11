import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ClinicsService } from './clinics.service.js';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles, Role } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('clinics')
@UseGuards(AuthGuard('cognito'), RolesGuard)
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @Roles(Role.DOCTOR)
  createClinic(@Body() dto: CreateClinicDto) {
    return this.clinicsService.createClinic(dto);
  }

  @Get(':id/departments')
  listDepartments(@Param('id') clinicId: string) {
    return this.clinicsService.listDepartments(clinicId);
  }
}
