import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ProceduresService } from './procedures.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { AssignProcedureDto } from './dto/assign-procedure.dto.js';
import { VersionCarePlanDto } from './dto/version-careplan.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { AuthGuard } from '@nestjs/passport';
import { Roles, Role } from '../auth/decorators/roles.decorator.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('procedures')
@UseGuards(AuthGuard('cognito'), RolesGuard)
export class ProceduresController {
  constructor(private readonly proceduresService: ProceduresService) {}

  @Get('templates')
  @Roles(Role.DOCTOR)
  listTemplates() {
    return this.proceduresService.listTemplates().then((data) => ({ success: true, data }));
  }

  @Post('templates')
  @Roles(Role.DOCTOR)
  createTemplate(@Body() dto: CreateTemplateDto) {
    return this.proceduresService.createTemplate(dto).then((data) => ({ success: true, data }));
  }

  @Get('templates/:id')
  @Roles(Role.DOCTOR)
  getTemplate(@Param('id') id: string) {
    return this.proceduresService.getTemplate(id).then((data) => ({ success: true, data }));
  }

  @Patch('templates/:id')
  @Roles(Role.DOCTOR)
  updateTemplate(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.proceduresService.updateTemplate(id, dto).then((data) => ({ success: true, data }));
  }

  @Delete('templates/:id')
  @Roles(Role.DOCTOR)
  deleteTemplate(@Param('id') id: string) {
    return this.proceduresService.deleteTemplate(id).then(() => ({ success: true }));
  }

  @Post('assign')
  @Roles(Role.DOCTOR)
  assignToPatient(@Body() dto: AssignProcedureDto, @Request() req: any) {
    const authorRef: string | undefined = req?.user?.fhirRef;
    return this.proceduresService.assignToPatient(dto, authorRef).then(() => ({ success: true }));
  }

  @Get('assigned')
  listAssigned(@Query('patientId') patientId?: string, @Request() req?: any) {
    if (!patientId) {
      return Promise.resolve({ success: false, error: 'patientId is required' });
    }
    
    // Check if caller is a patient (same pattern as profile stats)
    const userRoles: string[] = req?.user?.roles || [];
    const isPatient = !userRoles.includes('DOCTOR');
    
    if (isPatient) {
      // For patients, return detailed DTO with exams array
      // Extract actual patient ID from fhirRef if available
      let actualPatientId: string | undefined;
      if (req?.user?.fhirRef) {
        const parts = req.user.fhirRef.split('/');
        if (parts.length === 2 && parts[0] === 'Patient' && parts[1] && parts[1] !== 'profile') {
          actualPatientId = parts[1];
        }
      }
      const finalPatientId = actualPatientId || patientId;
      
      return this.proceduresService.listPatientProcedures(finalPatientId)
        .then((data) => ({ success: true, data }))
        .catch((error) => {
          console.error(`[listAssigned] Error fetching patient procedures:`, error);
          return { success: false, error: error?.message || 'Failed to fetch procedures', data: [] };
        });
    } else {
      // For doctors, return simpler DTO
      return this.proceduresService.listAssignedForPatient(patientId).then((data) => ({ success: true, data }));
    }
  }

  @Get('assigned/:id')
  getAssignedProcedure(@Param('id') id: string) {
    return this.proceduresService.getAssignedProcedureDetail(id).then((data) => ({ success: true, data }));
  }

  @Get('assigned/:id/overview')
  @Roles(Role.DOCTOR)
  getAssignedProcedureOverview(@Param('id') id: string) {
    return this.proceduresService.getAssignedProcedureOverview(id).then((data) => ({ success: true, data }));
  }

  @Get('assigned/:id/exam-results')
  @Roles(Role.DOCTOR)
  getAssignedProcedureExamResults(@Param('id') id: string) {
    return this.proceduresService.getAssignedProcedureExamResults(id).then((data) => ({ success: true, data }));
  }

  // Legacy endpoint - kept for backward compatibility but redirects to /assigned
  @Get('my-procedures/:patientId')
  myProcedures(@Param('patientId') patientId: string, @Request() req: any) {
    // Redirect to the standard /assigned endpoint
    return this.listAssigned(patientId, req);
  }

  @Get('my-procedures/:id')
  getMyProcedure(@Param('id') id: string) {
    return this.proceduresService.getCarePlanById(id).then((data) => ({ success: true, data }));
  }

  @Patch(':id')
  @Roles(Role.DOCTOR)
  versionCarePlan(@Param('id') id: string, @Body() dto: VersionCarePlanDto) {
    return this.proceduresService.versionCarePlan(id, dto).then((data) => ({ success: true, data }));
  }
}


