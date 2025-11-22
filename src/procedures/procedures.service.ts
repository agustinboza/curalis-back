import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { AssignProcedureDto } from './dto/assign-procedure.dto.js';
import { VersionCarePlanDto } from './dto/version-careplan.dto.js';
import { UpdateTemplateDto } from './dto/update-template.dto.js';
import { ProcedureTemplateResponseDto } from './dto/procedure-template-response.dto.js';
import { ProcedureTemplateDetailResponseDto } from './dto/procedure-template-detail-response.dto.js';
import { ExamTemplateResponseDto } from './dto/exam-template-response.dto.js';
import { AssignedProcedureResponseDto } from './dto/assigned-procedure-response.dto.js';
import { AssignedProcedureDetailResponseDto } from './dto/assigned-procedure-detail-response.dto.js';
import { AssignedProcedureOverviewResponseDto } from './dto/assigned-procedure-overview-response.dto.js';
import { ExamResultResponseDto } from './dto/exam-result-response.dto.js';
import { PatientProcedureResponseDto, PatientProcedureExamDto } from './dto/patient-procedure-response.dto.js';

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

  async listTemplates(): Promise<ProcedureTemplateResponseDto[]> {
    const bundle: any = await this.fhir.search('PlanDefinition', {} as any);
    const resources = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    const activeTemplates = resources.filter((r: any) => (r?.status ?? 'active') === 'active');
    
    // Transform to structured DTO with exam count
    return activeTemplates.map((template: any): ProcedureTemplateResponseDto => {
      // Count exam templates linked via action.definitionCanonical
        const actions = template?.action ?? [];
      const examCount = actions.filter((action: any) => {
        const canonical = action?.definitionCanonical;
        return typeof canonical === 'string' && canonical.startsWith('ActivityDefinition/');
      }).length;

        return {
          id: template.id,
          title: template.title || template.name || '',
          description: template.description,
          examCount,
      };
    });
  }

  async getTemplate(id: string): Promise<ProcedureTemplateDetailResponseDto> {
    const planDef: any = await this.fhir.read('PlanDefinition', id);
    
    // Extract exam template IDs from action.definitionCanonical
    const actions = planDef?.action ?? [];
    const examTemplateCanonicals = actions
      .map((action: any) => action.definitionCanonical)
      .filter((canonical: any): canonical is string => 
        typeof canonical === 'string' && canonical.startsWith('ActivityDefinition/')
    );
    
    // Read all linked exam templates
    const examTemplates = await Promise.all(
      examTemplateCanonicals.map(async (canonical: string) => {
        const examTemplateId = canonical.split('/')[1];
        try {
          const activityDef: any = await this.fhir.read('ActivityDefinition', examTemplateId);
          
          // Extract exam type from code.coding
          const type = activityDef?.code?.coding?.[0]?.code;
          
          return {
            id: activityDef.id,
            name: activityDef.name || '',
            type,
            description: activityDef.description,
          } as ExamTemplateResponseDto;
        } catch (error) {
          console.error(`Failed to read ActivityDefinition ${examTemplateId}:`, error);
          // Return minimal data if read fails
          return {
            id: examTemplateId,
            name: 'Unknown Exam',
          } as ExamTemplateResponseDto;
        }
      })
    );
    
    return {
      id: planDef.id,
      title: planDef.title || planDef.name || '',
      description: planDef.description,
      examTemplates,
    };
  }

  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<ProcedureTemplateDetailResponseDto> {
    const existing: any = await this.fhir.read('PlanDefinition', id);
    const updated: any = {
      ...existing,
      title: dto.title ?? existing.title,
      description: dto.description ?? existing.description,
      action: Array.isArray(dto.actions) ? this.mapActions(dto.actions) : existing.action,
    };
    await this.fhir.update('PlanDefinition', id, updated);
    
    return this.getTemplate(id);
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.fhir.delete('PlanDefinition', id);
  }

  async assignToPatient(dto: AssignProcedureDto, authorRef?: string): Promise<void> {
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
              const serviceRequest: any = {
                resourceType: 'ServiceRequest',
                status: 'active',
                intent: 'order',
                subject: { reference: `Patient/${dto.patientId}` },
                instantiatesCanonical: [canonical],
                basedOn: [{ reference: `CarePlan/${carePlanId}` }],
              };
          return this.fhir.create('ServiceRequest', serviceRequest)
            .catch((error) => {
              console.error(`Failed to create ServiceRequest for exam template ${examTemplateId}:`, error);
              return null;
            });
        });

      await Promise.all(examPromises);
    } catch (error) {
      console.error('Error creating exam ServiceRequests during procedure assignment:', error);
    }

  }

  async getCarePlanById(id: string) {
    return this.fhir.read('CarePlan', id);
  }

  private async getCarePlanAndTemplateInfo(id: string): Promise<{
    carePlan: any;
    templateName: string;
    templateDescription: string;
  }> {
    const carePlan: any = await this.fhir.read('CarePlan', id);
    
    // Extract template ID from instantiatesCanonical
    const templateCanonical = carePlan.instantiatesCanonical?.[0];
    const templateId = templateCanonical?.startsWith('PlanDefinition/') 
      ? templateCanonical.split('/')[1] 
      : undefined;

    // Fetch PlanDefinition to get template name and description
    let templateName = 'Procedure';
    let templateDescription = '';
    if (templateId) {
      try {
        const planDef: any = await this.fhir.read('PlanDefinition', templateId);
        templateName = planDef.title || planDef.name || 'Procedure';
        templateDescription = planDef.description || '';
      } catch (error) {
        console.error(`Error fetching PlanDefinition ${templateId}:`, error);
      }
    }

    return { carePlan, templateName, templateDescription };
  }

  private async getExamResultsForCarePlan(carePlanId: string): Promise<ExamResultResponseDto[]> {
    // Fetch ServiceRequests (exams) linked to this CarePlan
    let exams: any[] = [];
    try {
      const examsBundle: any = await this.fhir.search('ServiceRequest', { 'based-on': `CarePlan/${carePlanId}` });
      exams = (examsBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    } catch (error) {
      console.error(`Error fetching exams for CarePlan ${carePlanId}:`, error);
    }

    // Transform exams to ExamResultResponseDto
    return Promise.all(
      exams.map(async (exam: any): Promise<ExamResultResponseDto> => {
        // Extract ActivityDefinition ID from instantiatesCanonical
        const activityCanonical = exam.instantiatesCanonical?.[0];
        const activityId = activityCanonical?.startsWith('ActivityDefinition/') 
          ? activityCanonical.split('/')[1] 
          : undefined;

        // Fetch ActivityDefinition to get exam name and type
        let examName = 'Unknown Exam';
        let examType: 'blood_test' | 'imaging' | 'other' = 'other';
        
        if (activityId) {
          try {
            const activityDef: any = await this.fhir.read('ActivityDefinition', activityId);
            examName = activityDef.name || 'Unknown Exam';
            const code = activityDef.code?.coding?.[0]?.code?.toLowerCase() || 'other';
            examType = (code === 'blood_test' || code === 'imaging' ? code : 'other') as 'blood_test' | 'imaging' | 'other';
          } catch (error) {
            console.error(`Error fetching ActivityDefinition ${activityId}:`, error);
          }
        }

        // TODO: Fetch DocumentReference for results if needed
        return {
          id: exam.id,
          examName,
          type: examType,
          status: exam.status || 'draft',
          uploadedAt: exam.occurrenceDateTime,
          fileName: undefined,
          aiProcessed: false,
          extractedData: undefined,
        };
      })
    );
  }

  async getAssignedProcedureOverview(id: string): Promise<AssignedProcedureOverviewResponseDto> {
    const { carePlan, templateName, templateDescription } = await this.getCarePlanAndTemplateInfo(id);
    
    // Fetch exams to calculate progress
    const examResults = await this.getExamResultsForCarePlan(id);
    
    // Count completed exams
    const completedExams = examResults.filter((e) => e.status === 'completed').length;
    const totalExams = examResults.length;
    const progress = totalExams > 0 
      ? Math.min(100, Math.round((completedExams / totalExams) * 100))
      : 0;

    const assignedAt = carePlan.created || carePlan.meta?.lastUpdated || new Date().toISOString();

    return {
      id: carePlan.id,
      name: templateName,
      description: templateDescription,
      status: carePlan.status || 'active',
      assignedDate: new Date(assignedAt).toISOString().split('T')[0],
      progress,
      totalExams,
      completedExams,
    };
  }

  async getAssignedProcedureExamResults(id: string): Promise<ExamResultResponseDto[]> {
    return this.getExamResultsForCarePlan(id);
  }

  async getAssignedProcedureDetail(id: string): Promise<AssignedProcedureDetailResponseDto> {
    const { carePlan, templateName, templateDescription } = await this.getCarePlanAndTemplateInfo(id);
    const examResults = await this.getExamResultsForCarePlan(id);

    // Count completed exams
    const completedExams = examResults.filter((e) => e.status === 'completed').length;
    const totalExams = examResults.length;
    const progress = totalExams > 0 
      ? Math.min(100, Math.round((completedExams / totalExams) * 100))
      : 0;

    const assignedAt = carePlan.created || carePlan.meta?.lastUpdated || new Date().toISOString();

    return {
      id: carePlan.id,
      name: templateName,
      description: templateDescription,
      status: carePlan.status || 'active',
      assignedDate: new Date(assignedAt).toISOString().split('T')[0],
      progress,
      totalExams,
      completedExams,
      examResults,
    };
  }

  async listAssigned(filters: { patientId?: string; status?: string }) {
    const params: Record<string, string> = {};
    if (filters.patientId) params['subject'] = `Patient/${filters.patientId}`;
    if (filters.status) params['status'] = filters.status;
    const bundle: any = await this.fhir.search('CarePlan', params);
    const resources = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    return resources;
  }

  async listPatientProcedures(patientId: string): Promise<PatientProcedureResponseDto[]> {
    try {
      console.log(`[listPatientProcedures] Searching for CarePlans with subject: Patient/${patientId}`);
      let bundle: any;
      try {
        bundle = await this.fhir.search('CarePlan', { subject: `Patient/${patientId}` });
        console.log(`[listPatientProcedures] Found ${bundle?.entry?.length || 0} CarePlan entries`);
      } catch (error) {
        console.error(`[listPatientProcedures] Error searching CarePlans for patient ${patientId}:`, error);
        return []; // Return empty array instead of throwing
      }
      
      const carePlans = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
      console.log(`[listPatientProcedures] Processing ${carePlans.length} CarePlans`);
      
      if (carePlans.length === 0) {
        console.log(`[listPatientProcedures] No CarePlans found for patient ${patientId}`);
        return [];
      }
      
      return await Promise.all(
        carePlans.map(async (carePlan: any): Promise<PatientProcedureResponseDto> => {
        try {
          // Extract template ID from instantiatesCanonical
          const templateCanonical = carePlan.instantiatesCanonical?.[0];
          const templateId = templateCanonical?.startsWith('PlanDefinition/') 
            ? templateCanonical.split('/')[1] 
            : undefined;

          // Fetch PlanDefinition to get template name and description
          let templateName = 'Procedure';
          let templateDescription: string | undefined;
          if (templateId) {
            try {
              const planDef: any = await this.fhir.read('PlanDefinition', templateId);
              templateName = planDef.title || planDef.name || 'Procedure';
              templateDescription = planDef.description;
            } catch (error) {
              console.error(`[listPatientProcedures] Error fetching PlanDefinition ${templateId}:`, error);
            }
          }
        
          // Fetch ServiceRequests (exams) linked to this CarePlan
          let exams: any[] = [];
          try {
            const examsBundle: any = await this.fhir.search('ServiceRequest', { 'based-on': `CarePlan/${carePlan.id}` });
            exams = (examsBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
          } catch (error) {
            console.error(`[listPatientProcedures] Error fetching exams for CarePlan ${carePlan.id}:`, error);
          }

          // Transform exams to PatientProcedureExamDto
          const examDtos: PatientProcedureExamDto[] = await Promise.all(
            exams.map(async (exam: any): Promise<PatientProcedureExamDto> => {
              // Extract ActivityDefinition ID from instantiatesCanonical
              const activityCanonical = exam.instantiatesCanonical?.[0];
              const activityId = activityCanonical?.startsWith('ActivityDefinition/') 
                ? activityCanonical.split('/')[1] 
                : undefined;

              // Fetch ActivityDefinition to get exam name and type
              let examName = 'Unknown Exam';
              let examType: 'blood_test' | 'imaging' | 'other' = 'other';
              
              if (activityId) {
                try {
                  const activityDef: any = await this.fhir.read('ActivityDefinition', activityId);
                  examName = activityDef.name || 'Unknown Exam';
                  const code = activityDef.code?.coding?.[0]?.code?.toLowerCase() || 'other';
                  examType = (code === 'blood_test' || code === 'imaging' ? code : 'other') as 'blood_test' | 'imaging' | 'other';
                } catch (error) {
                  console.error(`[listPatientProcedures] Error fetching ActivityDefinition ${activityId}:`, error);
                }
              }

              // TODO: Fetch DocumentReference for results if needed
              return {
                id: exam.id,
                examName,
                type: examType,
                status: exam.status || 'draft',
                dueDate: exam.occurrenceDateTime,
                uploadedAt: undefined, // TODO: Get from DocumentReference
                fileName: undefined, // TODO: Get from DocumentReference
                aiProcessed: false, // TODO: Get from DocumentReference
                extractedData: undefined, // TODO: Get from DocumentReference
              };
            })
          );

          // Count completed exams
          const completedExams = examDtos.filter((e) => e.status === 'completed').length;
          const totalExams = examDtos.length;
          const progress = totalExams > 0 
            ? Math.min(100, Math.round((completedExams / totalExams) * 100))
            : 0;

          // Get assigned by (author) information
          let assignedBy: { id: string; firstName: string; lastName: string } | undefined;
          if (carePlan.author?.reference) {
            const authorRef = carePlan.author.reference;
            if (authorRef.startsWith('Practitioner/')) {
              const practitionerId = authorRef.split('/')[1];
              try {
                const practitioner: any = await this.fhir.read('Practitioner', practitionerId);
                const name = practitioner.name?.[0] || {};
                assignedBy = {
                  id: practitionerId,
                  firstName: name.given?.[0] || '',
                  lastName: name.family || '',
                };
              } catch (error) {
                console.error(`[listPatientProcedures] Error fetching Practitioner ${practitionerId}:`, error);
              }
            }
          }

          const assignedAt = carePlan.created || carePlan.meta?.lastUpdated || new Date().toISOString();
          
          return {
            id: carePlan.id,
            name: templateName,
            description: templateDescription,
            status: carePlan.status || 'active',
            assignedDate: new Date(assignedAt).toISOString().split('T')[0],
            assignedBy,
            progress,
            totalExams,
            completedExams,
            exams: examDtos,
          };
        } catch (error) {
          console.error(`[listPatientProcedures] Error processing CarePlan ${carePlan?.id}:`, error);
          // Return a minimal procedure DTO to prevent the entire list from failing
          const assignedAt = carePlan?.created || carePlan?.meta?.lastUpdated || new Date().toISOString();
          return {
            id: carePlan?.id || 'unknown',
            name: 'Procedure',
            description: undefined,
            status: carePlan?.status || 'active',
            assignedDate: new Date(assignedAt).toISOString().split('T')[0],
            assignedBy: undefined,
            progress: 0,
            totalExams: 0,
            completedExams: 0,
            exams: [],
          };
        }
        })
      );
    } catch (error) {
      console.error(`[listPatientProcedures] Unexpected error processing procedures for patient ${patientId}:`, error);
      return []; // Return empty array on any unexpected error
    }
  }

  async listAssignedForPatient(patientId: string): Promise<AssignedProcedureResponseDto[]> {
    const bundle: any = await this.fhir.search('CarePlan', { subject: `Patient/${patientId}` });
    const carePlans = (bundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
    
    // Transform each CarePlan to structured DTO
    return Promise.all(
      carePlans.map(async (carePlan: any): Promise<AssignedProcedureResponseDto> => {
        // Extract template ID from instantiatesCanonical
        const templateCanonical = carePlan.instantiatesCanonical?.[0];
        const templateId = templateCanonical?.startsWith('PlanDefinition/') 
          ? templateCanonical.split('/')[1] 
          : undefined;

        // Fetch PlanDefinition to get template name
        let templateName = 'Procedure';
        if (templateId) {
          try {
            const planDef: any = await this.fhir.read('PlanDefinition', templateId);
            templateName = planDef.title || planDef.name || 'Procedure';
          } catch (error) {
            console.error(`Error fetching PlanDefinition ${templateId}:`, error);
          }
        }
        
        // Fetch ServiceRequests (exams) linked to this CarePlan
        let exams: any[] = [];
        try {
          const examsBundle: any = await this.fhir.search('ServiceRequest', { 'based-on': `CarePlan/${carePlan.id}` });
          exams = (examsBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
          } catch (error) {
          console.error(`Error fetching exams for CarePlan ${carePlan.id}:`, error);
        }

        // Count completed exams
        const completedExams = exams.filter((e: any) => e.status === 'completed').length;
        const totalExams = exams.length;
        const progress = totalExams > 0 
          ? Math.min(100, Math.round((completedExams / totalExams) * 100))
          : 0;

        const assignedAt = carePlan.created || carePlan.meta?.lastUpdated || new Date().toISOString();
        
        return {
          id: carePlan.id,
          name: templateName,
          status: carePlan.status || 'active',
          assignedDate: new Date(assignedAt).toISOString().split('T')[0],
          progress,
          examCount: totalExams,
          completedExams,
        };
      })
    );
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
