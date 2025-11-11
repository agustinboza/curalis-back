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
exports.CheckinService = void 0;
const common_1 = require("@nestjs/common");
const fhir_service_js_1 = require("../fhir/fhir.service.js");
let CheckinService = class CheckinService {
    fhir;
    constructor(fhir) {
        this.fhir = fhir;
    }
    async uploadExam(dto) {
        const docRef = {
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
    async saveInterview(dto) {
        const qr = {
            resourceType: 'QuestionnaireResponse',
            status: 'completed',
            subject: { reference: `Patient/${dto.patientId}` },
            questionnaire: dto.questionnaireId ? `Questionnaire/${dto.questionnaireId}` : undefined,
            item: dto.items,
            basedOn: dto.appointmentId ? [{ reference: `Appointment/${dto.appointmentId}` }] : undefined,
        };
        return this.fhir.create('QuestionnaireResponse', qr);
    }
};
exports.CheckinService = CheckinService;
exports.CheckinService = CheckinService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [fhir_service_js_1.FhirService])
], CheckinService);
//# sourceMappingURL=checkin.service.js.map