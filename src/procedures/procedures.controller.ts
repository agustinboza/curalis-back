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
    return this.proceduresService.assignToPatient(dto, authorRef).then((data) => ({ success: true, data }));
  }

  @Get('assigned')
  listAssigned(@Query('patientId') patientId?: string, @Query('status') status?: string) {
    return this.proceduresService.listAssigned({ patientId, status }, true).then((data) => ({ success: true, data }));
  }

  @Get('my-procedures')
  myProcedures(@Request() req: any) {
    const roles: string[] = req.user?.roles ?? [];
    const fhirRef: string | undefined = req.user?.fhirRef;
    const isPatient = roles.includes(Role.PATIENT);
    const patientId = isPatient && typeof fhirRef === 'string' && fhirRef.startsWith('Patient/')
      ? fhirRef.split('/')[1]
      : undefined;
    return this.proceduresService.listAssigned({ patientId }, true).then((data) => ({ success: true, data }));
  }

  @Get('my-procedures/:id')
  getMyProcedure(@Param('id') id: string) {
    return this.proceduresService.getHydratedCarePlanById(id).then((data) => ({ success: true, data }));
  }

  @Patch(':id')
  @Roles(Role.DOCTOR)
  versionCarePlan(@Param('id') id: string, @Body() dto: VersionCarePlanDto) {
    return this.proceduresService.versionCarePlan(id, dto).then((data) => ({ success: true, data }));
  }
}


