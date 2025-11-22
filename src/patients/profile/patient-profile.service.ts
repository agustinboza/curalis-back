import { Injectable } from '@nestjs/common';
import { FhirService } from '../../fhir/fhir.service.js';
import { AuthService } from '../../auth/auth.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { PatientProfileResponseDto } from './dto/patient-profile-response.dto.js';
import { PatientProfileStatsResponseDto } from './dto/patient-profile-stats-response.dto.js';

@Injectable()
export class PatientProfileService {
  constructor(private readonly fhir: FhirService, private readonly auth: AuthService) {}

  async getProfile(identifier: string): Promise<PatientProfileResponseDto> {
    // First get basic info from auth service
    const basicInfo = await this.auth.me(identifier);
    console.log(`[getProfile] Basic info for ${identifier}:`, { fhirRef: basicInfo.fhirRef, id: basicInfo.id });
    
    // Extract FHIR Patient ID from fhirRef if available
    let fhirPatientId: string | undefined;
    if (basicInfo.fhirRef) {
      const parts = basicInfo.fhirRef.split('/');
      if (parts.length === 2 && parts[0] === 'Patient' && parts[1] && parts[1] !== 'profile') {
        fhirPatientId = parts[1];
        console.log(`[getProfile] Extracted FHIR Patient ID from fhirRef: ${fhirPatientId}`);
      }
    }
    
    // If we have a FHIR reference, fetch the full Patient resource
    if (fhirPatientId) {
      try {
        const patient: any = await this.fhir.read('Patient', fhirPatientId);
        
        // Extract name
        const nameObj = patient.name?.[0] || {};
        const firstName = nameObj.given?.[0] || basicInfo.firstName || '';
        const lastName = nameObj.family || basicInfo.lastName || '';
        
        // Extract email
        const email = this.pickEmail(patient.telecom) || identifier;
        
        // Extract weight and height from observations (if available)
        // TODO: Implement observation fetching for weight/height
        let weight: number | undefined;
        let height: number | undefined;
        
        // Extract comorbid conditions (from extension or condition resources)
        // TODO: Implement condition fetching
        const comorbidConditions: string[] = [];
        
        // Determine consent status
        // For now, assume consent is complete if patient has cognito identifier
        const hasCognitoSub = patient.identifier?.some((id: any) => id.system === 'cognito:user-sub' && id.value);
        const consentStatus = {
          isComplete: hasCognitoSub || false,
          signedAt: patient.meta?.lastUpdated || undefined,
        };
        
        // Email verified - assume true if email exists
        const emailVerified = !!email;
        
        // Always use the extracted fhirPatientId to ensure consistency with stats endpoint
        const finalPatientId = fhirPatientId || patient.id;
        console.log(`[getProfile] Returning profile with FHIR Patient ID: ${finalPatientId} (from fhirRef: ${fhirPatientId}, from patient resource: ${patient.id})`);
        return {
          id: finalPatientId, // Always use FHIR Patient ID extracted from fhirRef for consistency
          email,
          firstName,
          lastName,
          role: 'PATIENT',
          weight,
          height,
          comorbidConditions,
          consentStatus,
          consentSignedAt: consentStatus.signedAt,
          emailVerified,
          createdAt: patient.meta?.lastUpdated,
          updatedAt: patient.meta?.lastUpdated,
        };
      } catch (error: any) {
        // Log error but don't throw - fall through to basic info
        const status = error?.response?.status || error?.status;
        const message = error?.message || 'Unknown error';
        console.error(`[getProfile] Error fetching Patient resource for ${identifier} (fhirRef: ${basicInfo.fhirRef}, fhirPatientId: ${fhirPatientId}):`, status, message);
        // If it's a 404, the patient resource might not exist yet - that's okay, use basic info
        // But still use the FHIR Patient ID from fhirRef if we have it (and it's valid)
        // Don't use fhirPatientId if it's "profile" or invalid
        if (fhirPatientId === 'profile' || !fhirPatientId) {
          fhirPatientId = undefined;
        }
      }
    }
    
    // Fallback to basic info if FHIR resource not found
    // But use FHIR Patient ID if we extracted it from fhirRef (and it's valid)
    // Only use fhirPatientId if it's not "profile" and not empty
    const finalId = (fhirPatientId && fhirPatientId !== 'profile') ? fhirPatientId : (basicInfo.id || identifier);
    console.log(`[getProfile] Returning profile with id: ${finalId} (fhirPatientId: ${fhirPatientId}, basicInfo.id: ${basicInfo.id}, identifier: ${identifier})`);
    return {
      id: finalId, // Prefer FHIR Patient ID from fhirRef (if valid)
      email: basicInfo.email || identifier,
      firstName: basicInfo.firstName || '',
      lastName: basicInfo.lastName || '',
      role: 'PATIENT',
      weight: undefined,
      height: undefined,
      comorbidConditions: [],
      consentStatus: {
        isComplete: false,
      },
      emailVerified: false,
    };
  }

  async updateProfile(identifier: string, fhirRef: string, dto: UpdateProfileDto): Promise<PatientProfileResponseDto> {
    await this.auth.updateNames(identifier, dto.firstName, dto.lastName);
    // Update FHIR primary name as well
    if (fhirRef) {
      const parts = fhirRef.split('/');
      if (parts.length === 2 && parts[0] === 'Patient' && parts[1] && parts[1] !== 'profile') {
        const resourceType = parts[0];
        const id = parts[1];
        const resource: any = await this.fhir.read<any>(resourceType, id);
      const nextName = {
        family: dto.lastName ?? resource?.name?.[0]?.family,
        given: [dto.firstName ?? resource?.name?.[0]?.given?.[0]].filter(Boolean),
      };
      const next = {
        ...resource,
        name: [nextName],
      };
        await this.fhir.update(resourceType, id, next);
      }
    }
    // Return updated profile
    return this.getProfile(identifier);
  }

  async getProfileStats(identifier: string): Promise<PatientProfileStatsResponseDto> {
    // Get patient FHIR ID
    const basicInfo = await this.auth.me(identifier);
    let patientId: string | undefined;
    
    if (basicInfo.fhirRef) {
      const parts = basicInfo.fhirRef.split('/');
      if (parts.length === 2 && parts[0] === 'Patient' && parts[1] && parts[1] !== 'profile') {
        patientId = parts[1];
      }
    }

    if (!patientId) {
      // If no patient ID found, return zeros
      return {
        totalProcedures: 0,
        activeProcedures: 0,
        totalFollowUps: 0,
        pendingFollowUps: 0,
        totalExams: 0,
        pendingExams: 0,
      };
    }

    // Count procedures (CarePlans)
    let totalProcedures = 0;
    let activeProcedures = 0;
    try {
      const carePlanBundle: any = await this.fhir.search('CarePlan', { subject: `Patient/${patientId}` });
      const carePlans = (carePlanBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
      totalProcedures = carePlans.length;
      activeProcedures = carePlans.filter((cp: any) => cp.status === 'active').length;
    } catch (error) {
      console.error(`Error counting procedures for patient ${patientId}:`, error);
    }

    // Count follow-ups (currently mocked, will be 0)
    // TODO: Implement actual follow-up counting when follow-ups are properly stored
    const totalFollowUps = 0;
    const pendingFollowUps = 0;

    // Count exams (ServiceRequests)
    let totalExams = 0;
    let pendingExams = 0;
    try {
      const examsBundle: any = await this.fhir.search('ServiceRequest', { subject: `Patient/${patientId}` });
      const exams = (examsBundle?.entry ?? []).map((e: any) => e.resource).filter(Boolean);
      totalExams = exams.length;
      pendingExams = exams.filter((e: any) => e.status !== 'completed' && e.status !== 'cancelled').length;
    } catch (error) {
      console.error(`Error counting exams for patient ${patientId}:`, error);
    }

    return {
      totalProcedures,
      activeProcedures,
      totalFollowUps,
      pendingFollowUps,
      totalExams,
      pendingExams,
    };
  }

  private pickEmail(telecom?: Array<{ system?: string; value?: string }>): string | undefined {
    return telecom?.find((t) => t.system === 'email')?.value;
  }
}

