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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_js_1 = require("../fhir/fhir.service.js");
const auth_service_js_1 = require("../auth/auth.service.js");
let UsersService = class UsersService {
    fhir;
    auth;
    constructor(fhir, auth) {
        this.fhir = fhir;
        this.auth = auth;
    }
    getProfile(identifier) {
        return this.auth.me(identifier);
    }
    async updateProfile(identifier, fhirRef, dto) {
        const updated = await this.auth.updateNames(identifier, dto.firstName, dto.lastName);
        if (fhirRef) {
            const [resourceType, id] = fhirRef.split('/');
            const resource = await this.fhir.read(resourceType, id);
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
        return updated;
    }
    pickEmail(telecom) {
        return telecom?.find((t) => t.system === 'email')?.value;
    }
    async listPatients() {
        const bundle = await this.fhir.search('Patient', {});
        const resources = (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        const withSub = resources.filter((p) => (p?.identifier || []).some((id) => id?.system === 'cognito:user-sub' && id?.value));
        return withSub;
    }
    async listClinicians() {
        const bundle = await this.fhir.search('Practitioner', {});
        const resources = (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        const withSub = resources.filter((pr) => (pr?.identifier || []).some((id) => id?.system === 'cognito:user-sub' && id?.value));
        return withSub.map((pr) => {
            const name = pr?.name?.[0] || {};
            return {
                id: pr.id,
                email: this.pickEmail(pr.telecom) || '',
                firstName: name.given?.[0] || '',
                lastName: name.family || '',
                role: 'DOCTOR',
            };
        });
    }
    async deleteLegacyPatients() {
        const bundle = await this.fhir.search('Patient', {});
        const resources = (bundle?.entry ?? []).map((e) => e.resource).filter(Boolean);
        const legacy = resources.filter((p) => !((p?.identifier || []).some((id) => id?.system === 'cognito:user-sub' && id?.value)));
        let removed = 0;
        for (const p of legacy) {
            try {
                await this.fhir.delete('Patient', p.id);
                removed++;
            }
            catch {
            }
        }
        return removed;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fhir_service_js_1.FhirService, auth_service_js_1.AuthService])
], UsersService);
//# sourceMappingURL=users.service.js.map