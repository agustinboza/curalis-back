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
exports.PatientsService = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_js_1 = require("../fhir/fhir.service.js");
let PatientsService = class PatientsService {
    fhir;
    constructor(fhir) {
        this.fhir = fhir;
    }
    async create(dto) {
        const patient = {
            resourceType: 'Patient',
            name: [{ use: 'official', family: dto.lastName, given: [dto.firstName] }],
            gender: dto.gender,
            birthDate: dto.birthDate,
            telecom: dto.phone ? [{ system: 'phone', value: dto.phone }] : undefined,
        };
        return this.fhir.create('Patient', patient);
    }
    getById(id) {
        return this.fhir.read('Patient', id);
    }
};
exports.PatientsService = PatientsService;
exports.PatientsService = PatientsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fhir_service_js_1.FhirService])
], PatientsService);
//# sourceMappingURL=patients.service.js.map