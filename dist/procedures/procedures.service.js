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
    mapActions(actions) {
        return actions?.map((a) => ({ title: a.title, description: a.description }));
    }
    createTemplate(dto) {
        const planDefinition = {
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
        const bundle = await this.fhir.search('PlanDefinition', {});
        const resources = (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        return resources.filter((r) => (r?.status ?? 'active') === 'active');
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
            action: Array.isArray(dto.actions) ? this.mapActions(dto.actions) : existing.action,
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
            instantiatesCanonical: [`PlanDefinition/${dto.templateId}`],
            author: authorRef ? { reference: authorRef } : undefined,
        };
        if (dto.careTeamId) {
            carePlan.careTeam = [{ reference: `CareTeam/${dto.careTeamId}` }];
        }
        const createdCarePlan = await this.fhir.create('CarePlan', carePlan);
        const carePlanId = createdCarePlan.id;
        try {
            const planDef = await this.fhir.read('PlanDefinition', dto.templateId);
            const actions = planDef?.action || [];
            const examPromises = actions
                .map((action) => action.definitionCanonical)
                .filter((canonical) => typeof canonical === 'string' && canonical.startsWith('ActivityDefinition/'))
                .map((canonical) => {
                const examTemplateId = canonical.split('/')[1];
                return this.fhir.read('ActivityDefinition', examTemplateId)
                    .then((ad) => {
                    const dur = ad?.timingDuration;
                    let computedDueDate;
                    if (dur?.value && (dur?.code === 'd' || dur?.unit?.toLowerCase() === 'day' || dur?.unit?.toLowerCase() === 'days')) {
                        const days = Number(dur.value) || 0;
                        if (days > 0) {
                            const now = new Date();
                            now.setUTCDate(now.getUTCDate() + days);
                            computedDueDate = now.toISOString();
                        }
                    }
                    const serviceRequest = {
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
                    console.error(`Failed to create ServiceRequest for exam template ${examTemplateId}:`, error);
                    return null;
                });
            });
            await Promise.all(examPromises);
        }
        catch (error) {
            console.error('Error creating exam ServiceRequests during procedure assignment:', error);
        }
        return createdCarePlan;
    }
    async getCarePlanById(id) {
        return this.fhir.read('CarePlan', id);
    }
    async listAssigned(filters) {
        const params = {};
        if (filters.patientId)
            params['subject'] = `Patient/${filters.patientId}`;
        if (filters.status)
            params['status'] = filters.status;
        const bundle = await this.fhir.search('CarePlan', params);
        const resources = (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        return resources;
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
            instantiatesCanonical: oldCarePlan.instantiatesCanonical,
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