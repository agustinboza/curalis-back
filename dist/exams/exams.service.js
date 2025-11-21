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
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_js_1 = require("../fhir/fhir.service.js");
let ExamsService = class ExamsService {
    fhir;
    constructor(fhir) {
        this.fhir = fhir;
    }
    async listTemplates(procedureTemplateId) {
        if (!procedureTemplateId) {
            const bundle = await this.fhir.search('ActivityDefinition', {});
            return (bundle?.entry ?? []).map((e) => e.resource).filter((r) => (r?.status ?? 'active') === 'active');
        }
        const plan = await this.fhir.read('PlanDefinition', procedureTemplateId);
        const definitionCanonicals = (plan?.action ?? [])
            .map((a) => a.definitionCanonical)
            .filter((v) => typeof v === 'string');
        const ids = definitionCanonicals
            .map((c) => (c.startsWith('ActivityDefinition/') ? c.split('/')[1] : undefined))
            .filter(Boolean);
        return Promise.all(ids.map((id) => this.fhir.read('ActivityDefinition', id)));
    }
    createTimingDuration(days) {
        return days
            ? {
                value: days,
                unit: 'day',
                system: 'http://unitsofmeasure.org',
                code: 'd',
            }
            : undefined;
    }
    createCodeCoding(type) {
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
    createTemplate(dto) {
        const activityDefinition = {
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
    getTemplate(id) {
        return this.fhir.read('ActivityDefinition', id);
    }
    async updateTemplate(id, dto) {
        const existing = await this.fhir.read('ActivityDefinition', id);
        const updated = {
            ...existing,
            name: dto.name ?? existing.name,
            description: dto.description ?? existing.description,
            code: dto.type !== undefined ? this.createCodeCoding(dto.type) : existing.code,
            timingDuration: dto.defaultDueDays !== undefined ? this.createTimingDuration(dto.defaultDueDays) : existing.timingDuration,
        };
        return this.fhir.update('ActivityDefinition', id, updated);
    }
    async deleteTemplate(id) {
        const canonical = `ActivityDefinition/${id}`;
        const plansBundle = await this.fhir.search('PlanDefinition', {});
        const plans = (plansBundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        await Promise.all(plans.map(async (plan) => {
            const actions = Array.isArray(plan?.action) ? plan.action : [];
            const references = actions.some((a) => a?.definitionCanonical === canonical);
            if (!references)
                return;
            const filtered = actions.filter((a) => a?.definitionCanonical !== canonical);
            const updated = { ...plan, action: filtered };
            await this.fhir.update('PlanDefinition', plan.id, updated);
        }));
        const srBundle = await this.fhir.search('ServiceRequest', { 'instantiates-canonical': canonical });
        const srCount = (srBundle?.entry ?? []).length;
        if (srCount > 0) {
            throw new common_1.ConflictException('Cannot delete exam template because it is used by assigned exams.');
        }
        return this.fhir.delete('ActivityDefinition', id);
    }
    async linkTemplateToProcedure(examTemplateId, procedureTemplateId) {
        const plan = await this.fhir.read('PlanDefinition', procedureTemplateId);
        const canonical = `ActivityDefinition/${examTemplateId}`;
        const actions = Array.isArray(plan?.action) ? [...plan.action] : [];
        const exists = actions.some((a) => a.definitionCanonical === canonical);
        if (!exists) {
            actions.push({ definitionCanonical: canonical });
        }
        else {
            throw new common_1.ConflictException('Exam template already linked to this procedure template');
        }
        const updated = { ...plan, action: actions };
        return this.fhir.update('PlanDefinition', procedureTemplateId, updated);
    }
    async unlinkTemplateFromProcedure(examTemplateId, procedureTemplateId) {
        const plan = await this.fhir.read('PlanDefinition', procedureTemplateId);
        const canonical = `ActivityDefinition/${examTemplateId}`;
        const actions = (plan?.action ?? []).filter((a) => a.definitionCanonical !== canonical);
        const updated = { ...plan, action: actions };
        return this.fhir.update('PlanDefinition', procedureTemplateId, updated);
    }
    async assignExam(dto) {
        const carePlanId = dto.carePlanId ?? dto.assignedProcedureId;
        let computedDueDate = dto.dueDate;
        if (!computedDueDate) {
            try {
                const ad = await this.fhir.read('ActivityDefinition', dto.examTemplateId);
                const dur = ad?.timingDuration;
                if (dur?.value && (dur?.code === 'd' || dur?.unit?.toLowerCase() === 'day' || dur?.unit?.toLowerCase() === 'days')) {
                    const days = Number(dur.value) || 0;
                    if (days > 0) {
                        const now = new Date();
                        now.setUTCDate(now.getUTCDate() + days);
                        computedDueDate = now.toISOString();
                    }
                }
            }
            catch {
            }
        }
        const serviceRequest = {
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
    async listAssigned(filters) {
        const params = {};
        if (filters.patientId)
            params['subject'] = `Patient/${filters.patientId}`;
        if (filters.carePlanId)
            params['based-on'] = `CarePlan/${filters.carePlanId}`;
        if (filters.status)
            params['status'] = this.mapClientStatusToFhir(filters.status);
        const bundle = await this.fhir.search('ServiceRequest', params);
        const srs = (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        return srs;
    }
    async getAssignedById(id) {
        return this.fhir.read('ServiceRequest', id);
    }
    async updateAssignedStatus(id, dto) {
        const existing = await this.fhir.read('ServiceRequest', id);
        const fhirStatus = this.mapClientStatusToFhir(dto.status);
        const updated = { ...existing, status: fhirStatus };
        return this.fhir.update('ServiceRequest', id, updated);
    }
    async uploadResult(serviceRequestId, dto) {
        const sr = await this.fhir.read('ServiceRequest', serviceRequestId);
        const patientRef = sr?.subject?.reference;
        const docRef = {
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
    mapClientStatusToFhir(status) {
        return status === 'completed' ? 'completed' : 'active';
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fhir_service_js_1.FhirService])
], ExamsService);
//# sourceMappingURL=exams.service.js.map