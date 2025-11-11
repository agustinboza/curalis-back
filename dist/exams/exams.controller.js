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
exports.ExamsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_decorator_js_1 = require("../auth/decorators/roles.decorator.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
const exams_service_js_1 = require("./exams.service.js");
const create_exam_template_dto_js_1 = require("./dto/create-exam-template.dto.js");
const update_exam_template_dto_js_1 = require("./dto/update-exam-template.dto.js");
const assign_exam_dto_js_1 = require("./dto/assign-exam.dto.js");
const update_assigned_exam_status_dto_js_1 = require("./dto/update-assigned-exam-status.dto.js");
const upload_exam_result_dto_js_1 = require("./dto/upload-exam-result.dto.js");
let ExamsController = class ExamsController {
    exams;
    constructor(exams) {
        this.exams = exams;
    }
    listTemplates(procedureTemplateId) {
        return this.exams.listTemplates(procedureTemplateId).then((data) => ({ success: true, data }));
    }
    createTemplate(dto) {
        return this.exams.createTemplate(dto).then((data) => ({ success: true, data }));
    }
    getTemplate(id) {
        return this.exams.getTemplate(id).then((data) => ({ success: true, data }));
    }
    updateTemplate(id, dto) {
        return this.exams.updateTemplate(id, dto).then((data) => ({ success: true, data }));
    }
    deleteTemplate(id) {
        return this.exams.deleteTemplate(id).then(() => ({ success: true }));
    }
    linkToProcedure(examTemplateId, procedureTemplateId) {
        return this.exams.linkTemplateToProcedure(examTemplateId, procedureTemplateId).then((data) => ({ success: true, data }));
    }
    unlinkFromProcedure(examTemplateId, procedureTemplateId) {
        return this.exams.unlinkTemplateFromProcedure(examTemplateId, procedureTemplateId).then((data) => ({ success: true, data }));
    }
    assign(dto) {
        return this.exams.assignExam(dto).then((data) => ({ success: true, data }));
    }
    listAssigned(patientId, carePlanId, status) {
        return this.exams.listAssigned({ patientId, carePlanId, status }).then((data) => ({ success: true, data }));
    }
    getAssigned(id) {
        return this.exams.getAssignedById(id).then((data) => ({ success: true, data }));
    }
    updateAssignedStatus(id, dto) {
        return this.exams.updateAssignedStatus(id, dto).then((data) => ({ success: true, data }));
    }
    uploadResult(id, dto) {
        return this.exams.uploadResult(id, dto).then((data) => ({ success: true, data }));
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Query)('procedureTemplateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_exam_template_dto_js_1.CreateExamTemplateDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Patch)('templates/:id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_exam_template_dto_js_1.UpdateExamTemplateDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Post)('templates/:examTemplateId/link/:procedureTemplateId'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('examTemplateId')),
    __param(1, (0, common_1.Param)('procedureTemplateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "linkToProcedure", null);
__decorate([
    (0, common_1.Delete)('templates/:examTemplateId/unlink/:procedureTemplateId'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('examTemplateId')),
    __param(1, (0, common_1.Param)('procedureTemplateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "unlinkFromProcedure", null);
__decorate([
    (0, common_1.Post)('assign'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_exam_dto_js_1.AssignExamDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "assign", null);
__decorate([
    (0, common_1.Get)('assigned'),
    __param(0, (0, common_1.Query)('patientId')),
    __param(1, (0, common_1.Query)('carePlanId')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "listAssigned", null);
__decorate([
    (0, common_1.Get)('assigned/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "getAssigned", null);
__decorate([
    (0, common_1.Patch)('assigned/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_assigned_exam_status_dto_js_1.UpdateAssignedExamStatusDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "updateAssignedStatus", null);
__decorate([
    (0, common_1.Post)('assigned/:id/results'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, upload_exam_result_dto_js_1.UploadExamResultDto]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "uploadResult", null);
exports.ExamsController = ExamsController = __decorate([
    (0, common_1.Controller)('exams'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('cognito'), roles_guard_js_1.RolesGuard),
    __metadata("design:paramtypes", [exams_service_js_1.ExamsService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map