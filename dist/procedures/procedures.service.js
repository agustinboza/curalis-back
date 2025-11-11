"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProceduresService = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_js_1 = require("../fhir/fhir.service.js");
let ProceduresService = class ProceduresService {
    fhir;
    constructor(fhir) {
        this.fhir = fhir;
    }
    createTemplate(dto) {
        const planDefinition = {
            resourceType: 'PlanDefinition',
            status: 'active',
            title: dto.title,
            description: dto.description,
        };
        if (dto.actions?.length) {
            planDefinition.action = dto.actions.map((a) => ({ title: a.title, description: a.description }));
        }
        return this.fhir.create('PlanDefinition', planDefinition);
    }
    async listTemplates() {
        const bundle = await this.fhir.search('PlanDefinition', { status: 'active' });
        const resources = (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        return resources;
    }
    getTemplate(id) {
        return this.fhir.read('PlanDefinition', id);
    }
    async updateTemplate(id, dto) {
        const existing = await this.fhir.read('PlanDefinition', id);
        const updated = {
            ...existing,
            title: dto.title ?? existing.title,
            description: dto.description ?? existing.description,
            action: Array.isArray(dto.actions)
                ? dto.actions.map((a) => ({ title: a.title, description: a.description }))
                : existing.action,
        };
        return this.fhir.update('PlanDefinition', id, updated);
    }
    deleteTemplate(id) {
        return this.fhir.delete('PlanDefinition', id);
    }
    async assignToPatient(dto, authorRef) {
        const carePlan = {
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
    getCarePlanById(id) {
        return this.fhir.read('CarePlan', id);
    }
    extractId(ref) {
        if (!ref)
            return undefined;
        const parts = ref.split('/');
        return parts[1];
    }
    async hydrateExam(sr, carePlanId) {
        const templateCanonical = (sr.instantiatesCanonical ?? [])[0];
        const templateId = templateCanonical?.startsWith('ActivityDefinition/') ? templateCanonical.split('/')[1] : undefined;
        const template = templateId ? await this.fhir.read('ActivityDefinition', templateId) : undefined;
        const resultsBundle = await this.fhir.search('DocumentReference', { related: `ServiceRequest/${sr.id}` });
        const results = (resultsBundle?.entry ?? [])
            .map((e) => e.resource)
            .filter(Boolean)
            .map((doc) => {
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
    async hydrateCarePlan(cp) {
        const patientId = this.extractId(cp?.subject?.reference);
        const basedOnRef = cp?.basedOn?.[0]?.reference;
        const templateId = basedOnRef?.startsWith('PlanDefinition/') ? basedOnRef.split('/')[1] : undefined;
        const planDef = templateId ? await this.fhir.read('PlanDefinition', templateId) : undefined;
        const examsBundle = await this.fhir.search('ServiceRequest', { 'based-on': `CarePlan/${cp.id}` });
        const srs = (examsBundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        const exams = await Promise.all(srs.map((sr) => this.hydrateExam(sr, cp.id)));
        const status = cp.status === 'revoked' ? 'cancelled' : (cp.status || 'active');
        const assignedByRef = cp?.author?.reference;
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
    async getHydratedCarePlanById(id) {
        const cp = await this.fhir.read('CarePlan', id);
        return this.hydrateCarePlan(cp);
    }
    async listAssigned(filters, hydrate = false) {
        const params = {};
        if (filters.patientId)
            params['subject'] = `Patient/${filters.patientId}`;
        if (filters.status)
            params['status'] = filters.status;
        const bundle = await this.fhir.search('CarePlan', params);
        const resources = (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        if (!hydrate)
            return resources;
        const hydrated = await Promise.all(resources.map((cp) => this.hydrateCarePlan(cp)));
        return hydrated;
    }
    async versionCarePlan(oldCarePlanId, dto) {
        const oldCarePlan = await this.fhir.read('CarePlan', oldCarePlanId);
        await this.fhir.update('CarePlan', oldCarePlanId, { ...oldCarePlan, status: 'revoked' });
        const newCarePlan = {
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
};
exports.ProceduresService = ProceduresService;
exports.ProceduresService = ProceduresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fhir_service_js_1.FhirService])
], ProceduresService);
//# sourceMappingURL=procedures.service.js.map