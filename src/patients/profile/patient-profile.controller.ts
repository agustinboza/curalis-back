import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PatientProfileService } from './patient-profile.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Controller('patients/profile')
@UseGuards(AuthGuard('cognito'))
export class PatientProfileController {
  constructor(private readonly patientProfileService: PatientProfileService) {}

  @Get()
  async getProfile(@Request() req: any) {
    try {
      const identifier: string = req.user?.email || req.user?.phone_number;
      if (!identifier) {
        return { success: false, error: 'User identifier not found' };
      }
      const data = await this.patientProfileService.getProfile(identifier);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error in getProfile:', error);
      // Don't throw - return error response instead to prevent logout
      return { success: false, error: error?.message || 'Failed to fetch profile' };
    }
  }

  @Put()
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    const email: string = req.user?.email || req.user?.phone_number;
    const fhirRef: string = req.user?.fhirRef;
    const data = await this.patientProfileService.updateProfile(email, fhirRef, dto);
    return { success: true, data };
  }

  @Get('stats')
  async getProfileStats(@Request() req: any) {
    try {
      const identifier: string = req.user?.email || req.user?.phone_number;
      if (!identifier) {
        return { success: false, error: 'User identifier not found' };
      }
      const data = await this.patientProfileService.getProfileStats(identifier);
      return { success: true, data };
    } catch (error: any) {
      console.error('Error in getProfileStats:', error);
      // Don't throw - return error response instead to prevent logout
      return { success: false, error: error?.message || 'Failed to fetch profile stats' };
    }
  }
}

