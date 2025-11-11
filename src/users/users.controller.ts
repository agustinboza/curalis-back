import { Body, Controller, Delete, Get, Put, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles, Role } from '../auth/decorators/roles.decorator.js';

@Controller('users')
@UseGuards(AuthGuard('cognito'))
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: any) {
    const identifier: string = req.user?.email || req.user?.phone_number;
    return this.users.getProfile(identifier);
  }

  @Put('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const email: string = req.user?.email || req.user?.phone_number;
    const fhirRef: string = req.user?.fhirRef;
    return this.users.updateProfile(email, fhirRef, dto);
  }

  @Get('patients')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  async listPatients() {
    const data = await this.users.listPatients();
    return { success: true, data };
  }

  @Delete('legacy-patients')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  async deleteLegacyPatients() {
    const removed = await this.users.deleteLegacyPatients();
    return { success: true, data: { removed } };
  }

  @Get('clinicians')
  @UseGuards(RolesGuard)
  @Roles(Role.DOCTOR)
  async listClinicians() {
    const data = await this.users.listClinicians();
    return { success: true, data };
  }
}


