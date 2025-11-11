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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClinicsController = void 0;
const common_1 = require("@nestjs/common");
const clinics_service_js_1 = require("./clinics.service.js");
const create_clinic_dto_1 = require("./dto/create-clinic.dto");
const passport_1 = require("@nestjs/passport");
const roles_decorator_js_1 = require("../auth/decorators/roles.decorator.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
let ClinicsController = class ClinicsController {
    clinicsService;
    constructor(clinicsService) {
        this.clinicsService = clinicsService;
    }
    createClinic(dto) {
        return this.clinicsService.createClinic(dto);
    }
    listDepartments(clinicId) {
        return this.clinicsService.listDepartments(clinicId);
    }
};
exports.ClinicsController = ClinicsController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_clinic_dto_1.CreateClinicDto]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "createClinic", null);
__decorate([
    (0, common_1.Get)(':id/departments'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ClinicsController.prototype, "listDepartments", null);
exports.ClinicsController = ClinicsController = __decorate([
    (0, common_1.Controller)('clinics'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('cognito'), roles_guard_js_1.RolesGuard),
    __metadata("design:paramtypes", [clinics_service_js_1.ClinicsService])
], ClinicsController);
//# sourceMappingURL=clinics.controller.js.map