import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles, Role } from '../../auth/decorators/roles.decorator.js';
import { DoctorProfileService } from './doctor-profile.service.js';

@Controller('doctors/profile')
@UseGuards(AuthGuard('cognito'), RolesGuard)
@Roles(Role.DOCTOR)
export class DoctorProfileController {
  constructor(private readonly doctorProfileService: DoctorProfileService) {}

  @Get('stats')
  async getProfileStats() {
    const data = await this.doctorProfileService.getProfileStats();
    return { success: true, data };
  }
}

