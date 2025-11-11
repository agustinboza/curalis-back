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
exports.DoctorsService = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_js_1 = require("../fhir/fhir.service.js");
let DoctorsService = class DoctorsService {
    fhir;
    constructor(fhir) {
        this.fhir = fhir;
    }
    async createDoctor(dto) {
        const practitioner = await this.fhir.create('Practitioner', {
            resourceType: 'Practitioner',
            name: [{ family: dto.lastName, given: [dto.firstName] }],
        });
        const role = await this.fhir.create('PractitionerRole', {
            resourceType: 'PractitionerRole',
            practitioner: { reference: `Practitioner/${practitioner.id}` },
            organization: { reference: `Organization/${dto.departmentId}` },
            specialty: dto.specialty
                ? [
                    {
                        coding: [
                            {
                                system: 'http://snomed.info/sct',
                                code: '408443003',
                                display: dto.specialty,
                            },
                        ],
                    },
                ]
                : undefined,
        });
        return { practitioner, role };
    }
    getSchedule(practitionerId) {
        return this.fhir.search('Schedule', { actor: `Practitioner/${practitionerId}` });
    }
};
exports.DoctorsService = DoctorsService;
exports.DoctorsService = DoctorsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fhir_service_js_1.FhirService])
], DoctorsService);
//# sourceMappingURL=doctors.service.js.map