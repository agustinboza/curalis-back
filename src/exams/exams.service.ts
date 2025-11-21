import { Injectable, ConflictException } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto.js';
import { UpdateExamTemplateDto } from './dto/update-exam-template.dto.js';
import { AssignExamDto } from './dto/assign-exam.dto.js';
import { UpdateAssignedExamStatusDto } from './dto/update-assigned-exam-status.dto.js';
import { UploadExamResultDto } from './dto/upload-exam-result.dto.js';

@Injectable()
export class ExamsService {
  constructor(private readonly fhir: FhirService) {}

  async listTemplates(procedureTemplateId?: string) {
    if (!procedureTemplateId) {
      const bundle: any = await this.fhir.search('ActivityDefinition', {} as any);
      return (bundle?.entry ?? []).map((e: any) => e.resource).filter((r: any) => (r?.status ?? 'active') === 'active');
    }
    const plan: any = await this.fhir.read('PlanDefinition', procedureTemplateId);
    const definitionCanonicals = (plan?.action ?? [])
      .map((a: any) => a.definitionCanonical)
      .filter((v: any) => typeof v === 'string');
    const ids = definitionCanonicals
      .map((c: string) => (c.startsWith('ActivityDefinition/') ? c.split('/')[1] : undefined))
      .filter(Boolean) as string[];
    return Promise.all(ids.map((id) => this.fhir.read<any>('ActivityDefinition', id)));
  }

  private createTimingDuration(days?: number) {
    return days
      ? {
          value: days,
          unit: 'day',
          system: 'http://unitsofmeasure.org',
          code: 'd',
        }
      : undefined;
  }

  private createCodeCoding(type?: string) {
    return type
      ? {
          coding: [
            {
              system: 'http://example.org/exam-types',
              code: type,
              display: type,
            },
          ],
        }
      : undefined;
  }

  createTemplate(dto: CreateExamTemplateDto) {
    const activityDefinition: any = {
      resourceType: 'ActivityDefinition',
      status: 'active',
      name: dto.name,
      description: dto.description,
      kind: 'ServiceRequest',
      code: this.createCodeCoding(dto.type),
      timingDuration: this.createTimingDuration(dto.defaultDueDays),
    };
    return this.fhir.create('ActivityDefinition', activityDefinition);
  }

  getTemplate(id: string) {
    return this.fhir.read('ActivityDefinition', id);
  }

  async updateTemplate(id: string, dto: UpdateExamTemplateDto) {
    const existing: any = await this.fhir.read('ActivityDefinition', id);
    const updated: any = {
      ...existing,
      name: dto.name ?? existing.name,
      description: dto.description ?? existing.description,
      code: dto.type !== undefined ? this.createCodeCoding(dto.type) : existing.code,
      timingDuration: dto.defaultDueDays !== undefined ? this.createTimingDuration(dto.defaultDueDays) : existing.timingDuration,
    };
    return this.fhir.update('ActivityDefinition', id, updated);
  }

  async deleteTemplate(id: string) {
    const canonical = `ActivityDefinition/${id}`;
    // 1) Unlink from any PlanDefinitions that reference this ActivityDefinition
    const plansBundle: any = await this.fhir.search('PlanDefinition', {} as any);
    const plans = (plansBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    await Promise.all(
      plans.map(async (plan: any) => {
        const actions: any[] = Array.isArray(plan?.action) ? plan.action : [];
        const references = actions.some((a: any) => a?.definitionCanonical === canonical);
        if (!references) return;
        const filtered = actions.filter((a: any) => a?.definitionCanonical !== canonical);
        const updated: any = { ...plan, action: filtered };
        await this.fhir.update('PlanDefinition', plan.id, updated);
      }),
    );

    // 2) If any ServiceRequest still references this template, block deletion with a clear error
    const srBundle: any = await this.fhir.search('ServiceRequest', { 'instantiates-canonical': canonical } as any);
    const srCount = (srBundle?.entry ?? []).length;
    if (srCount > 0) {
      throw new ConflictException('Cannot delete exam template because it is used by assigned exams.');
    }

    // 3) Delete the ActivityDefinition
    return this.fhir.delete('ActivityDefinition', id);
  }

  async linkTemplateToProcedure(examTemplateId: string, procedureTemplateId: string) {
    const plan: any = await this.fhir.read('PlanDefinition', procedureTemplateId);
    const canonical = `ActivityDefinition/${examTemplateId}`;
    const actions: any[] = Array.isArray(plan?.action) ? [...plan.action] : [];
    const exists = actions.some((a) => a.definitionCanonical === canonical);
    if (!exists) {
      actions.push({ definitionCanonical: canonical });
    } else {
      // Prevent duplicate linking
      throw new ConflictException('Exam template already linked to this procedure template');
    }
    const updated: any = { ...plan, action: actions };
    return this.fhir.update('PlanDefinition', procedureTemplateId, updated);
  }

  async unlinkTemplateFromProcedure(examTemplateId: string, procedureTemplateId: string) {
    const plan: any = await this.fhir.read('PlanDefinition', procedureTemplateId);
    const canonical = `ActivityDefinition/${examTemplateId}`;
    const actions: any[] = (plan?.action ?? []).filter((a: any) => a.definitionCanonical !== canonical);
    const updated: any = { ...plan, action: actions };
    return this.fhir.update('PlanDefinition', procedureTemplateId, updated);
  }

  async assignExam(dto: AssignExamDto) {
    const carePlanId = dto.carePlanId ?? dto.assignedProcedureId;
    // If dueDate not provided, try to derive from template timingDuration
    let computedDueDate: string | undefined = dto.dueDate;
    if (!computedDueDate) {
      try {
        const ad: any = await this.fhir.read('ActivityDefinition', dto.examTemplateId);
        const dur = ad?.timingDuration;
        if (dur?.value && (dur?.code === 'd' || dur?.unit?.toLowerCase() === 'day' || dur?.unit?.toLowerCase() === 'days')) {
          const days = Number(dur.value) || 0;
          if (days > 0) {
            const now = new Date();
            now.setUTCDate(now.getUTCDate() + days);
            computedDueDate = now.toISOString();
          }
        }
      } catch {
        // ignore
      }
    }

    const serviceRequest: any = {
      resourceType: 'ServiceRequest',
      status: 'active',
      intent: 'order',
      subject: { reference: `Patient/${dto.patientId}` },
      instantiatesCanonical: [`ActivityDefinition/${dto.examTemplateId}`],
      basedOn: carePlanId ? [{ reference: `CarePlan/${carePlanId}` }] : undefined,
      occurrenceDateTime: computedDueDate,
      note: dto.notes ? [{ text: dto.notes }] : undefined,
      supportingInfo: dto.appointmentId ? [{ reference: `Appointment/${dto.appointmentId}` }] : undefined,
    };
    return this.fhir.create('ServiceRequest', serviceRequest);
  }

  async listAssigned(filters: { patientId?: string; carePlanId?: string; status?: string }) {
    const params: Record<string, string> = {};
    if (filters.patientId) params['subject'] = `Patient/${filters.patientId}`;
    if (filters.carePlanId) params['based-on'] = `CarePlan/${filters.carePlanId}`;
    if (filters.status) params['status'] = this.mapClientStatusToFhir(filters.status);
    const bundle: any = await this.fhir.search('ServiceRequest', params);
    const srs = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    return srs;
  }

  async getAssignedById(id: string) {
    return this.fhir.read('ServiceRequest', id);
  }

  async updateAssignedStatus(id: string, dto: UpdateAssignedExamStatusDto) {
    const existing: any = await this.fhir.read('ServiceRequest', id);
    const fhirStatus = this.mapClientStatusToFhir(dto.status);
    const updated: any = { ...existing, status: fhirStatus };
    return this.fhir.update('ServiceRequest', id, updated);
  }

  async uploadResult(serviceRequestId: string, dto: UploadExamResultDto) {
    const sr: any = await this.fhir.read('ServiceRequest', serviceRequestId);
    const patientRef = sr?.subject?.reference;
    const docRef: any = {
      resourceType: 'DocumentReference',
      status: 'current',
      subject: { reference: patientRef ?? (dto.patientId ? `Patient/${dto.patientId}` : undefined) },
      description: dto.title,
      content: [
        {
          attachment: {
            url: dto.url,
            contentType: dto.contentType,
            title: dto.title,
          },
        },
      ],
      context: {
        related: [{ reference: `ServiceRequest/${serviceRequestId}` }],
      },
    };
    return this.fhir.create('DocumentReference', docRef);
  }

  private mapClientStatusToFhir(status: string): string {
    return status === 'completed' ? 'completed' : 'active';
  }
}