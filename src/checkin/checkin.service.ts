import { Injectable } from '@nestjs/common';
import { FhirService } from '../fhir/fhir.service.js';
import { UploadExamDto } from './dto/upload-exam.dto.js';
import { AiInterviewDto } from './dto/ai-interview.dto.js';

@Injectable()
export class CheckinService {
  constructor(private readonly fhir: FhirService) {}

  async uploadExam(dto: UploadExamDto) {
    const docRef: any = {
      resourceType: 'DocumentReference',
      status: 'current',
      subject: { reference: `Patient/${dto.patientId}` },
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
      context: dto.appointmentId
        ? { encounter: [{ reference: `Appointment/${dto.appointmentId}` }] }
        : undefined,
    };
    return this.fhir.create('DocumentReference', docRef);
  }

  async saveInterview(dto: AiInterviewDto) {
    const qr: any = {
      resourceType: 'QuestionnaireResponse',
      status: 'completed',
      subject: { reference: `Patient/${dto.patientId}` },
      questionnaire: dto.questionnaireId ? `Questionnaire/${dto.questionnaireId}` : undefined,
      item: dto.items,
      basedOn: dto.appointmentId ? [{ reference: `Appointment/${dto.appointmentId}` }] : undefined,
    };
    return this.fhir.create('QuestionnaireResponse', qr);
  }
}


