import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CheckinService } from './checkin.service.js';
import { UploadExamDto } from './dto/upload-exam.dto.js';
import { AiInterviewDto } from './dto/ai-interview.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { Roles, Role } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('checkin')
@UseGuards(AuthGuard('cognito'), RolesGuard)
export class CheckinController {
  constructor(private readonly checkinService: CheckinService) {}

  @Post('exams')
  @Roles(Role.DOCTOR)
  uploadExam(@Body() dto: UploadExamDto) {
    return this.checkinService.uploadExam(dto);
  }

  @Post('ai-interview')
  @Roles(Role.DOCTOR)
  aiInterview(@Body() dto: AiInterviewDto) {
    return this.checkinService.saveInterview(dto);
  }
}


