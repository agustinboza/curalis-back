import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { TelehealthService } from './telehealth.service.js';
import { CreateTelehealthSessionDto } from './dto/create-telehealth-session.dto.js';
import { JoinTelehealthSessionDto } from './dto/join-telehealth-session.dto.js';

@Controller('telehealth')
export class TelehealthController {
  constructor(private readonly telehealthService: TelehealthService) {}

  @Post('sessions')
  async createSession(@Body() dto: CreateTelehealthSessionDto) {
    const result = await this.telehealthService.createSession(dto);
    return { success: true, data: result };
  }

  @Post('sessions/:sessionId/join')
  async joinSession(@Param('sessionId') sessionId: string, @Body() dto: JoinTelehealthSessionDto) {
    const result = await this.telehealthService.joinSession(sessionId, dto);
    return { success: true, data: result };
  }

  @Delete('sessions/:sessionId')
  async endSession(@Param('sessionId') sessionId: string) {
    await this.telehealthService.endSession(sessionId);
    return { success: true };
  }
}
