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
exports.CheckinController = void 0;
const common_1 = require("@nestjs/common");
const checkin_service_js_1 = require("./checkin.service.js");
const upload_exam_dto_js_1 = require("./dto/upload-exam.dto.js");
const ai_interview_dto_js_1 = require("./dto/ai-interview.dto.js");
const passport_1 = require("@nestjs/passport");
const roles_decorator_js_1 = require("../auth/decorators/roles.decorator.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
let CheckinController = class CheckinController {
    checkinService;
    constructor(checkinService) {
        this.checkinService = checkinService;
    }
    uploadExam(dto) {
        return this.checkinService.uploadExam(dto);
    }
    aiInterview(dto) {
        return this.checkinService.saveInterview(dto);
    }
};
exports.CheckinController = CheckinController;
__decorate([
    (0, common_1.Post)('exams'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upload_exam_dto_js_1.UploadExamDto]),
    __metadata("design:returntype", void 0)
], CheckinController.prototype, "uploadExam", null);
__decorate([
    (0, common_1.Post)('ai-interview'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ai_interview_dto_js_1.AiInterviewDto]),
    __metadata("design:returntype", void 0)
], CheckinController.prototype, "aiInterview", null);
exports.CheckinController = CheckinController = __decorate([
    (0, common_1.Controller)('checkin'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('cognito'), roles_guard_js_1.RolesGuard),
    __metadata("design:paramtypes", [checkin_service_js_1.CheckinService])
], CheckinController);
//# sourceMappingURL=checkin.controller.js.map