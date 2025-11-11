import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { AssignProcedureDto } from './dto/assign-procedure.dto.js';
import { VersionCarePlanDto } from './dto/version-careplan.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';

@Injectable()
export class ProceduresService {
  constructor(private readonly fhir: FhirService) {}

  createTemplate(dto: CreateTemplateDto) {
    const planDefinition: any = {
      resourceType: 'PlanDefinition',
      status: 'active',
      title: dto.title,
      description: dto.description,
    };
    if (dto.actions?.length) {
      planDefinition.action = dto.actions.map((a: { title: string; description?: string }) => ({ title: a.title, description: a.description }));
    }
    return this.fhir.create('PlanDefinition', planDefinition);
  }

  async listTemplates() {
    const bundle: any = await this.fhir.search('PlanDefinition', {} as any);
    const resources = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    // If needed, filter locally by status to avoid search-index delays
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
      action: Array.isArray(dto.actions)
        ? dto.actions.map((a: { title: string; description?: string }) => ({ title: a.title, description: a.description }))
        : existing.action,
    };
    return this.fhir.update('PlanDefinition', id, updated);
  }

  deleteTemplate(id: string) {
    return this.fhir.delete('PlanDefinition', id);
  }

  async assignToPatient(dto: AssignProcedureDto, authorRef?: string) {
    const carePlan: any = {
      resourceType: 'CarePlan',
      status: 'active',
      intent: 'plan',
      title: dto.title,
      subject: { reference: `Patient/${dto.patientId}` },
      basedOn: [{ reference: `PlanDefinition/${dto.templateId}` }],
      author: authorRef ? { reference: authorRef } : undefined,
    };
    if (dto.careTeamId) {
      carePlan.careTeam = [{ reference: `CareTeam/${dto.careTeamId}` }];
    }
    return this.fhir.create('CarePlan', carePlan);
  }

  getCarePlanById(id: string) {
    return this.fhir.read('CarePlan', id);
  }

  private extractId(ref?: string): string | undefined {
    if (!ref) return undefined;
    const parts = ref.split('/');
    return parts[1];
  }

  private async hydrateExam(sr: any, carePlanId: string) {
    const templateCanonical: string | undefined = (sr.instantiatesCanonical ?? [])[0];
    const templateId = templateCanonical?.startsWith('ActivityDefinition/') ? templateCanonical.split('/')[1] : undefined;
    const template = templateId ? await this.fhir.read<any>('ActivityDefinition', templateId) : undefined;

    // fetch results
    const resultsBundle: any = await this.fhir.search('DocumentReference', { related: `ServiceRequest/${sr.id}` } as any);
    const results = (resultsBundle?.entry ?? [])
      .map((e: any) => e.resource)
      .filter(Boolean)
      .map((doc: any) => {
        const att = doc?.content?.[0]?.attachment ?? {};
        return {
          id: doc.id,
          examId: sr.id,
          uploadedAt: doc.date || doc.meta?.lastUpdated,
          fileUrl: att.url,
          fileName: att.title,
          fileType: att.contentType,
          aiProcessed: false,
          extractedData: undefined,
        };
      });

    const type = template?.code?.coding?.[0]?.code || 'other';
    const status = sr.status === 'completed' ? 'completed' : 'pending';
    return {
      id: sr.id,
      procedureId: carePlanId,
      examTemplate: { id: templateId, name: template?.name || 'Exam', type },
      status,
      prescriptionUrl: undefined,
      results,
      dueDate: sr.occurrenceDateTime,
    };
  }

  private async hydrateCarePlan(cp: any) {
    const patientId = this.extractId(cp?.subject?.reference);
    const basedOnRef: string | undefined = cp?.basedOn?.[0]?.reference;
    const templateId = basedOnRef?.startsWith('PlanDefinition/') ? basedOnRef.split('/')[1] : undefined;
    const planDef = templateId ? await this.fhir.read<any>('PlanDefinition', templateId) : undefined;

    const examsBundle: any = await this.fhir.search('ServiceRequest', { 'based-on': `CarePlan/${cp.id}` });
    const srs = (examsBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const exams = await Promise.all(srs.map((sr: any) => this.hydrateExam(sr, cp.id)));

    const status = cp.status === 'revoked' ? 'cancelled' : (cp.status || 'active');
    const assignedByRef: string | undefined = cp?.author?.reference;
    const assignedBy = assignedByRef ? { id: this.extractId(assignedByRef) } : undefined;

    return {
      id: cp.id,
      patientId,
      procedureTemplate: { id: templateId, name: planDef?.title || 'Procedure', description: planDef?.description },
      assignedBy,
      assignedAt: cp.created || cp.meta?.lastUpdated,
      status,
      assignedExams: exams,
      prescriptionUrl: undefined,
    };
  }

  async getHydratedCarePlanById(id: string) {
    const cp: any = await this.fhir.read('CarePlan', id);
    return this.hydrateCarePlan(cp);
  }

  async listAssigned(filters: { patientId?: string; status?: string }, hydrate: boolean = false) {
    const params: Record<string, string> = {};
    if (filters.patientId) params['subject'] = `Patient/${filters.patientId}`;
    if (filters.status) params['status'] = filters.status;
    const bundle: any = await this.fhir.search('CarePlan', params);
    const resources = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    if (!hydrate) return resources;
    const hydrated = await Promise.all(resources.map((cp: any) => this.hydrateCarePlan(cp)));
    return hydrated;
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
      basedOn: oldCarePlan.basedOn,
      careTeam: oldCarePlan.careTeam,
      replaces: [{ reference: `CarePlan/${oldCarePlanId}` }],
    };
    return this.fhir.create('CarePlan', newCarePlan);
  }
}


