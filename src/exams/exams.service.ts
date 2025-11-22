import { Injectable, ConflictException } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreateExamTemplateDto } from './dto/create-exam-template.dto.js';
import { UpdateExamTemplateDto } from './dto/update-exam-template.dto.js';
import { AssignExamDto } from './dto/assign-exam.dto.js';
import { UpdateAssignedExamStatusDto } from './dto/update-assigned-exam-status.dto.js';
import { UploadExamResultDto } from './dto/upload-exam-result.dto.js';
import { ExamTemplateResponseDto } from '../procedures/dto/exam-template-response.dto.js';
import { AssignedExamDetailResponseDto } from './dto/assigned-exam-detail-response.dto.js';
import { ExamResultResponseDto } from '../procedures/dto/exam-result-response.dto.js';

@Injectable()
export class ExamsService {
  constructor(private readonly fhir: FhirService) {}

  async listTemplates(procedureTemplateId?: string): Promise<ExamTemplateResponseDto[]> {
    let activityDefinitions: any[];
    
    if (!procedureTemplateId) {
      // Get all exam templates
      const bundle: any = await this.fhir.search('ActivityDefinition', {} as any);
      activityDefinitions = (bundle?.entry ?? [])
        .map((e: any) => e.resource)
        .filter((r: any) => (r?.status ?? 'active') === 'active');
    } else {
      // Get exam templates linked to a specific procedure template
      const plan: any = await this.fhir.read('PlanDefinition', procedureTemplateId);
      const definitionCanonicals = (plan?.action ?? [])
        .map((a: any) => a.definitionCanonical)
        .filter((v: any) => typeof v === 'string');
      const ids = definitionCanonicals
        .map((c: string) => (c.startsWith('ActivityDefinition/') ? c.split('/')[1] : undefined))
        .filter(Boolean) as string[];
      activityDefinitions = await Promise.all(ids.map((id) => this.fhir.read<any>('ActivityDefinition', id)));
    }
    
    // Transform to structured DTOs
    return activityDefinitions.map((ad: any): ExamTemplateResponseDto => {
      const type = ad?.code?.coding?.[0]?.code;
      
      return {
        id: ad.id,
        name: ad.name || '',
        type,
        description: ad.description,
      };
    });
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

  async createTemplate(dto: CreateExamTemplateDto): Promise<ExamTemplateResponseDto> {
    const activityDefinition: any = {
      resourceType: 'ActivityDefinition',
      status: 'active',
      name: dto.name,
      description: dto.description,
      kind: 'ServiceRequest',
      code: this.createCodeCoding(dto.type),
    };
    const created = await this.fhir.create('ActivityDefinition', activityDefinition);
    
    // Return structured DTO
    const type = created?.code?.coding?.[0]?.code;
    return {
      id: created.id,
      name: created.name || '',
      type,
      description: created.description,
    };
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
    };
    return this.fhir.update('ActivityDefinition', id, updated);
  }

  async deleteTemplate(id: string): Promise<void> {
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
    await this.fhir.delete('ActivityDefinition', id);
  }

  async linkExamTemplateToProcedureTemplate(examTemplateId: string, procedureTemplateId: string): Promise<ExamTemplateResponseDto> {
    const plan: any = await this.fhir.read('PlanDefinition', procedureTemplateId);
    const canonical = `ActivityDefinition/${examTemplateId}`;
    const actions: any[] = Array.isArray(plan?.action) ? [...plan.action] : [];
    const exists = actions.some((a) => a.definitionCanonical === canonical);
    if (!exists) {
      actions.push({ definitionCanonical: canonical });
    } else {
      throw new ConflictException('Exam template already linked to this procedure template');
    }
    const updated: any = { ...plan, action: actions };
    await this.fhir.update('PlanDefinition', procedureTemplateId, updated);
    
    // Read and return the exam template as structured DTO
    const activityDef: any = await this.fhir.read('ActivityDefinition', examTemplateId);
    
    // Extract exam type from code.coding
    const type = activityDef?.code?.coding?.[0]?.code;
    
    return {
      id: activityDef.id,
      name: activityDef.name || '',
      type,
      description: activityDef.description,
    };
  }

  async unlinkExamTemplateFromProcedureTemplate(examTemplateId: string, procedureTemplateId: string): Promise<void> {
    const plan: any = await this.fhir.read('PlanDefinition', procedureTemplateId);
    const canonical = `ActivityDefinition/${examTemplateId}`;
    const actions: any[] = (plan?.action ?? []).filter((a: any) => a.definitionCanonical !== canonical);
    const updated: any = { ...plan, action: actions };
    await this.fhir.update('PlanDefinition', procedureTemplateId, updated);
  }

  async assignExamToAssignedProcedure(dto: AssignExamDto): Promise<ExamResultResponseDto> {
    const carePlanId = dto.carePlanId ?? dto.assignedProcedureId;
    const computedDueDate: string | undefined = dto.dueDate;

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
    
    const created = await this.fhir.create('ServiceRequest', serviceRequest);
    
    // Fetch ActivityDefinition to get exam name and type
    let examName = 'Unknown Exam';
    let examType: 'blood_test' | 'imaging' | 'other' = 'other';
    
    try {
      const activityDef: any = await this.fhir.read('ActivityDefinition', dto.examTemplateId);
      examName = activityDef.name || 'Unknown Exam';
      const code = activityDef.code?.coding?.[0]?.code?.toLowerCase() || 'other';
      examType = (code === 'blood_test' || code === 'imaging' ? code : 'other') as 'blood_test' | 'imaging' | 'other';
    } catch (error) {
      console.error(`Error fetching ActivityDefinition ${dto.examTemplateId}:`, error);
    }

    return {
      id: created.id,
      examName,
      type: examType,
      status: created.status || 'active',
      uploadedAt: created.occurrenceDateTime,
      fileName: undefined,
      aiProcessed: false,
      extractedData: undefined,
    };
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

  async getAssignedById(id: string): Promise<AssignedExamDetailResponseDto> {
    const serviceRequest: any = await this.fhir.read('ServiceRequest', id);
    
    // Extract ActivityDefinition ID from instantiatesCanonical
    const activityCanonical = serviceRequest.instantiatesCanonical?.[0];
    const activityId = activityCanonical?.startsWith('ActivityDefinition/') 
      ? activityCanonical.split('/')[1] 
      : undefined;

    // Fetch ActivityDefinition to get exam name, description, and type
    let examName = 'Unknown Exam';
    let examDescription: string | undefined;
    let examType: 'blood_test' | 'imaging' | 'other' = 'other';
    
    if (activityId) {
      try {
        const activityDef: any = await this.fhir.read('ActivityDefinition', activityId);
        examName = activityDef.name || 'Unknown Exam';
        examDescription = activityDef.description;
        const code = activityDef.code?.coding?.[0]?.code?.toLowerCase() || 'other';
        examType = (code === 'blood_test' || code === 'imaging' ? code : 'other') as 'blood_test' | 'imaging' | 'other';
      } catch (error) {
        console.error(`Error fetching ActivityDefinition ${activityId}:`, error);
      }
    }

    // Fetch DocumentReferences (uploaded results) for this ServiceRequest
    const uploadedResultsArray: Array<{
      id: string;
      uploadedAt: string;
      fileUrl: string;
      fileName: string;
      fileType: string;
      aiProcessed: boolean;
      extractedData?: Record<string, any>;
    }> = [];
    try {
      // Get patient ID from ServiceRequest to search by subject
      const patientRef = serviceRequest.subject?.reference;
      if (patientRef) {
        // Search DocumentReferences by patient, then filter by context.related
        const docRefBundle: any = await this.fhir.search('DocumentReference', { 
          subject: patientRef 
        });
        const allDocRefs = (docRefBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
        
        // Filter to only those related to this ServiceRequest
        const serviceRequestRef = `ServiceRequest/${id}`;
        const docRefs = allDocRefs.filter((docRef: any) => 
          docRef.context?.related?.some((rel: any) => rel.reference === serviceRequestRef)
        );
        
        uploadedResultsArray.push(...docRefs.map((docRef: any) => ({
          id: docRef.id,
          uploadedAt: docRef.date || docRef.meta?.lastUpdated || new Date().toISOString(),
          fileUrl: docRef.content?.[0]?.attachment?.url || '',
          fileName: docRef.content?.[0]?.attachment?.title || docRef.description || 'Unknown file',
          fileType: docRef.content?.[0]?.attachment?.contentType || 'application/octet-stream',
          aiProcessed: false, // TODO: Extract from extension if available
          extractedData: undefined, // TODO: Extract from extension if available
        })));
      }
    } catch (error) {
      console.error(`Error fetching DocumentReferences for ServiceRequest ${id}:`, error);
    }

    return {
      id: serviceRequest.id,
      examName,
      description: examDescription,
      type: examType,
      status: serviceRequest.status || 'active',
      dueDate: serviceRequest.occurrenceDateTime,
      uploadedResults: uploadedResultsArray.length > 0 ? uploadedResultsArray : undefined,
      prescriptionUrl: undefined, // TODO: Extract from extension if available
    };
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