import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles, Role } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { ExamsService } from './exams.service.js';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto.js';
import { UpdateExamTemplateDto } from './dto/update-exam-template.dto.js';
import { AssignExamDto } from './dto/assign-exam.dto.js';
import { UpdateAssignedExamStatusDto } from './dto/update-assigned-exam-status.dto.js';
import { UploadExamResultDto } from './dto/upload-exam-result.dto.js';

@Controller('exams')
@UseGuards(AuthGuard('cognito'), RolesGuard)
export class ExamsController {
  constructor(private readonly exams: ExamsService) {}

  @Get('templates')
  @Roles(Role.DOCTOR)
  listTemplates(@Query('procedureTemplateId') procedureTemplateId?: string) {
    return this.exams.listTemplates(procedureTemplateId).then((data) => ({ success: true, data }));
  }

  @Post('templates')
  @Roles(Role.DOCTOR)
  createTemplate(@Body() dto: CreateExamTemplateDto) {
    return this.exams.createTemplate(dto).then((data) => ({ success: true, data }));
  }

  @Get('templates/:id')
  @Roles(Role.DOCTOR)
  getTemplate(@Param('id') id: string) {
    return this.exams.getTemplate(id).then((data) => ({ success: true, data }));
  }

  @Patch('templates/:id')
  @Roles(Role.DOCTOR)
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateExamTemplateDto) {
    return this.exams.updateTemplate(id, dto).then((data) => ({ success: true, data }));
  }

  @Delete('templates/:id')
  @Roles(Role.DOCTOR)
  deleteTemplate(@Param('id') id: string) {
    return this.exams.deleteTemplate(id).then(() => ({ success: true }));
  }

  @Post('templates/:examTemplateId/link/:procedureTemplateId')
  @Roles(Role.DOCTOR)
  linkToProcedure(
    @Param('examTemplateId') examTemplateId: string,
    @Param('procedureTemplateId') procedureTemplateId: string,
  ) {
    return this.exams.linkExamTemplateToProcedureTemplate(examTemplateId, procedureTemplateId).then((data) => ({ success: true, data }));
  }

  @Delete('templates/:examTemplateId/unlink/:procedureTemplateId')
  @Roles(Role.DOCTOR)
  unlinkFromProcedure(
    @Param('examTemplateId') examTemplateId: string,
    @Param('procedureTemplateId') procedureTemplateId: string,
  ) {
    return this.exams.unlinkExamTemplateFromProcedureTemplate(examTemplateId, procedureTemplateId).then(() => ({ success: true }));
  }

  @Post('assign')
  @Roles(Role.DOCTOR)
  assignExamToAssignedProcedure(@Body() dto: AssignExamDto) {
    return this.exams.assignExamToAssignedProcedure(dto).then((data) => ({ success: true, data }));
  }

  @Get('assigned')
  listAssigned(
    @Query('patientId') patientId?: string,
    @Query('carePlanId') carePlanId?: string,
    @Query('status') status?: string,
  ) {
    return this.exams.listAssigned({ patientId, carePlanId, status }).then((data) => ({ success: true, data }));
  }

  @Get('assigned/:id')
  getAssigned(@Param('id') id: string) {
    return this.exams.getAssignedById(id).then((data) => ({ success: true, data }));
  }

  @Patch('assigned/:id')
  updateAssignedStatus(@Param('id') id: string, @Body() dto: UpdateAssignedExamStatusDto) {
    return this.exams.updateAssignedStatus(id, dto).then((data) => ({ success: true, data }));
  }

  @Post('assigned/:id/results')
  uploadResult(@Param('id') id: string, @Body() dto: UploadExamResultDto) {
    return this.exams.uploadResult(id, dto).then((data) => ({ success: true, data }));
  }
}


