import { Body, Controller, Delete, Param, Post, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { TelehealthService } from './telehealth.service.js';
import { CreateTelehealthSessionDto } from './dto/create-telehealth-session.dto.js';
import { JoinTelehealthSessionDto } from './dto/join-telehealth-session.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

@Controller('telehealth')
@UseGuards(JwtAuthGuard)
export class TelehealthController {
  constructor(private readonly telehealthService: TelehealthService) { }

  @Post('sessions')
  async createSession(@Request() req: any, @Body() dto: CreateTelehealthSessionDto) {
    const user = req.user;
    if (!user.fhirRef) {
      // If we can't link the user to a FHIR resource, we might want to block or handle it.
      // For now, we'll proceed but ideally we need a patient/practitioner ID.
    }
    // Pass the user context to the service
    const result = await this.telehealthService.createSession(dto, user);
    return { success: true, data: result };
  }

  @Post('sessions/:sessionId/join')
  async joinSession(@Request() req: any, @Param('sessionId') sessionId: string, @Body() dto: JoinTelehealthSessionDto) {
    const user = req.user;
    const result = await this.telehealthService.joinSession(sessionId, dto, user);
    return { success: true, data: result };
  }

  @Delete('sessions/:sessionId')
  async endSession(@Param('sessionId') sessionId: string) {
    await this.telehealthService.endSession(sessionId);
    return { success: true };
  }
}
