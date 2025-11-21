import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { AssignProcedureDto } from './dto/assign-procedure.dto.js';
import { VersionCarePlanDto } from './dto/version-careplan.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';

@Injectable()
export class ProceduresService {
  constructor(private readonly fhir: FhirService) {}

  private mapActions(actions?: Array<{ title: string; description?: string }>) {
    return actions?.map((a) => ({ title: a.title, description: a.description }));
  }

  createTemplate(dto: CreateTemplateDto) {
    const planDefinition: any = {
      resourceType: 'PlanDefinition',
      status: 'active',
      title: dto.title,
      description: dto.description,
    };
    if (dto.actions?.length) {
      planDefinition.action = this.mapActions(dto.actions);
    }
    return this.fhir.create('PlanDefinition', planDefinition);
  }

  async listTemplates() {
    const bundle: any = await this.fhir.search('PlanDefinition', {} as any);
    const resources = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    return resources.filter((r: any) => (r?.status ?? 'active') === 'active');
  }

  getTemplate(id: string) {
    return this.fhir.read('PlanDefinition', id);
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto) {
    const existing: any = await this.fhir.read('PlanDefinition', id);
    const updated: any = {
      ...existing,
      title: dto.title ?? existing.title,
      description: dto.description ?? existing.description,
      action: Array.isArray(dto.actions) ? this.mapActions(dto.actions) : existing.action,
    };
    return this.fhir.update('PlanDefinition', id, updated);
  }

  deleteTemplate(id: string) {
    return this.fhir.delete('PlanDefinition', id);
  }

  async assignToPatient(dto: AssignProcedureDto, authorRef?: string) {
    // Create the CarePlan
    const carePlan: any = {
      resourceType: 'CarePlan',
      status: 'active',
      intent: 'plan',
      title: dto.title,
      subject: { reference: `Patient/${dto.patientId}` },
      instantiatesCanonical: [`PlanDefinition/${dto.templateId}`],
      author: authorRef ? { reference: authorRef } : undefined,
    };
    if (dto.careTeamId) {
      carePlan.careTeam = [{ reference: `CareTeam/${dto.careTeamId}` }];
    }
    const createdCarePlan = await this.fhir.create('CarePlan', carePlan);
    const carePlanId = createdCarePlan.id;

    // Read the PlanDefinition to get linked exam templates
    try {
      const planDef: any = await this.fhir.read('PlanDefinition', dto.templateId);
      const actions = planDef?.action || [];
      
      // Create ServiceRequests for each exam template linked to the procedure template
      const examPromises = actions
        .map((action: any) => action.definitionCanonical)
        .filter((canonical: any): canonical is string => 
          typeof canonical === 'string' && canonical.startsWith('ActivityDefinition/')
        )
        .map((canonical: string) => {
          const examTemplateId = canonical.split('/')[1];
          
          // Read ActivityDefinition to get timingDuration for due date
          return this.fhir.read<any>('ActivityDefinition', examTemplateId)
            .then((ad: any) => {
              const dur = ad?.timingDuration;
              let computedDueDate: string | undefined;
              if (dur?.value && (dur?.code === 'd' || dur?.unit?.toLowerCase() === 'day' || dur?.unit?.toLowerCase() === 'days')) {
                const days = Number(dur.value) || 0;
                if (days > 0) {
                  const now = new Date();
                  now.setUTCDate(now.getUTCDate() + days);
                  computedDueDate = now.toISOString();
                }
              }

              const serviceRequest: any = {
                resourceType: 'ServiceRequest',
                status: 'active',
                intent: 'order',
                subject: { reference: `Patient/${dto.patientId}` },
                instantiatesCanonical: [canonical],
                basedOn: [{ reference: `CarePlan/${carePlanId}` }],
                occurrenceDateTime: computedDueDate,
              };
              return this.fhir.create('ServiceRequest', serviceRequest);
            })
            .catch((error) => {
              // Log error but don't fail the entire assignment if one exam fails
              console.error(`Failed to create ServiceRequest for exam template ${examTemplateId}:`, error);
              return null;
            });
        });

      // Wait for all exam ServiceRequests to be created (ignore failures)
      await Promise.all(examPromises);
    } catch (error) {
      // Log error but don't fail the assignment if we can't read PlanDefinition or create exams
      console.error('Error creating exam ServiceRequests during procedure assignment:', error);
    }

    return createdCarePlan;
  }


  async getCarePlanById(id: string) {
    return this.fhir.read('CarePlan', id);
  }

  async listAssigned(filters: { patientId?: string; status?: string }) {
    const params: Record<string, string> = {};
    if (filters.patientId) params['subject'] = `Patient/${filters.patientId}`;
    if (filters.status) params['status'] = filters.status;
    const bundle: any = await this.fhir.search('CarePlan', params);
    const resources = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    return resources;
  }

  async versionCarePlan(oldCarePlanId: string, dto: VersionCarePlanDto) {
    const oldCarePlan = await this.fhir.read<any>('CarePlan', oldCarePlanId);
    // Mark old care plan inactive
    await this.fhir.update('CarePlan', oldCarePlanId, { ...oldCarePlan, status: 'revoked' });

    // Create new care plan replacing the old one
    const newCarePlan: any = {
      resourceType: 'CarePlan',
      status: 'active',
      intent: oldCarePlan.intent ?? 'plan',
      title: dto.title ?? oldCarePlan.title,
      description: dto.description ?? oldCarePlan.description,
      subject: oldCarePlan.subject,
      instantiatesCanonical: oldCarePlan.instantiatesCanonical,
      careTeam: oldCarePlan.careTeam,
      replaces: [{ reference: `CarePlan/${oldCarePlanId}` }],
    };
    return this.fhir.create('CarePlan', newCarePlan);
  }
}
