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
exports.ProceduresController = void 0;
const common_1 = require("@nestjs/common");
const procedures_service_js_1 = require("./procedures.service.js");
const create_template_dto_js_1 = require("./dto/create-template.dto.js");
const assign_procedure_dto_js_1 = require("./dto/assign-procedure.dto.js");
const version_careplan_dto_js_1 = require("./dto/version-careplan.dto.js");
const update_template_dto_js_1 = require("./dto/update-template.dto.js");
const passport_1 = require("@nestjs/passport");
const roles_decorator_js_1 = require("../auth/decorators/roles.decorator.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
let ProceduresController = class ProceduresController {
    proceduresService;
    constructor(proceduresService) {
        this.proceduresService = proceduresService;
    }
    listTemplates() {
        return this.proceduresService.listTemplates().then((data) => ({ success: true, data }));
    }
    createTemplate(dto) {
        return this.proceduresService.createTemplate(dto).then((data) => ({ success: true, data }));
    }
    getTemplate(id) {
        return this.proceduresService.getTemplate(id).then((data) => ({ success: true, data }));
    }
    updateTemplate(id, dto) {
        return this.proceduresService.updateTemplate(id, dto).then((data) => ({ success: true, data }));
    }
    deleteTemplate(id) {
        return this.proceduresService.deleteTemplate(id).then(() => ({ success: true }));
    }
    assignToPatient(dto, req) {
        const authorRef = req?.user?.fhirRef;
        return this.proceduresService.assignToPatient(dto, authorRef).then((data) => ({ success: true, data }));
    }
    listAssigned(patientId, status) {
        return this.proceduresService.listAssigned({ patientId, status }).then((data) => ({ success: true, data }));
    }
    getAssignedProcedure(id) {
        return this.proceduresService.getCarePlanById(id).then((data) => ({ success: true, data }));
    }
    myProcedures(req) {
        const roles = req.user?.roles ?? [];
        const fhirRef = req.user?.fhirRef;
        const isPatient = roles.includes(roles_decorator_js_1.Role.PATIENT);
        const patientId = isPatient && typeof fhirRef === 'string' && fhirRef.startsWith('Patient/')
            ? fhirRef.split('/')[1]
            : undefined;
        return this.proceduresService.listAssigned({ patientId }).then((data) => ({ success: true, data }));
    }
    getMyProcedure(id) {
        return this.proceduresService.getCarePlanById(id).then((data) => ({ success: true, data }));
    }
    versionCarePlan(id, dto) {
        return this.proceduresService.versionCarePlan(id, dto).then((data) => ({ success: true, data }));
    }
};
exports.ProceduresController = ProceduresController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_template_dto_js_1.CreateTemplateDto]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_template_dto_js_1.UpdateTemplateDto]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_procedure_dto_js_1.AssignProcedureDto, Object]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "assignToPatient", null);
__decorate([
    (0, common_1.Get)('assigned'),
    __param(0, (0, common_1.Query)('patientId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "listAssigned", null);
__decorate([
    (0, common_1.Get)('assigned/:id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "getAssignedProcedure", null);
__decorate([
    (0, common_1.Get)('my-procedures'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "myProcedures", null);
__decorate([
    (0, common_1.Get)('my-procedures/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "getMyProcedure", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, version_careplan_dto_js_1.VersionCarePlanDto]),
    __metadata("design:returntype", void 0)
], ProceduresController.prototype, "versionCarePlan", null);
exports.ProceduresController = ProceduresController = __decorate([
    (0, common_1.Controller)('procedures'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('cognito'), roles_guard_js_1.RolesGuard),
    __metadata("design:paramtypes", [procedures_service_js_1.ProceduresService])
], ProceduresController);
//# sourceMappingURL=procedures.controller.js.map