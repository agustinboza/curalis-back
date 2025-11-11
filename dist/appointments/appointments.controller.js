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
exports.AppointmentsController = void 0;
const common_1 = require("@nestjs/common");
const appointments_service_js_1 = require("./appointments.service.js");
const create_appointment_dto_js_1 = require("./dto/create-appointment.dto.js");
const passport_1 = require("@nestjs/passport");
const roles_decorator_js_1 = require("../auth/decorators/roles.decorator.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
const set_working_hours_dto_js_1 = require("./dto/set-working-hours.dto.js");
const create_blocked_time_dto_js_1 = require("./dto/create-blocked-time.dto.js");
let AppointmentsController = class AppointmentsController {
    appointmentsService;
    constructor(appointmentsService) {
        this.appointmentsService = appointmentsService;
    }
    book(dto) {
        if (dto.start && dto.end && dto.patientId && dto.practitionerId) {
            return this.appointmentsService.create(dto).then((data) => ({ success: true, data }));
        }
        const start = dto.startTime;
        const durationMinutes = Number(dto.durationMinutes ?? 30);
        const startDate = new Date(start);
        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
        return this.appointmentsService.create({
            patientId: dto.patientId,
            practitionerId: dto.doctorId ?? dto.practitionerId,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        }).then((data) => ({ success: true, data }));
    }
    create(dto) {
        return this.appointmentsService.create(dto).then((data) => ({ success: true, data }));
    }
    startCheckIn(id) {
        return this.appointmentsService.startCheckInAsync(id).then((data) => ({ success: true, data }));
    }
    getById(id) {
        return this.appointmentsService.getById(id).then((data) => ({ success: true, data }));
    }
    getRequiredExams(id) {
        return this.appointmentsService.getRequiredExams(id).then((data) => ({ success: true, data }));
    }
    me(req) {
        const roles = req.user?.roles ?? [];
        const fhirRef = req.user?.fhirRef;
        if (!fhirRef)
            return { success: true, data: [] };
        return this.appointmentsService.listForParticipant(fhirRef).then((data) => ({ success: true, data }));
    }
    getAvailability(practitionerId, date, slotMinutes) {
        const minutes = Number(slotMinutes ?? 30);
        return this.appointmentsService.getAvailability(practitionerId, date, minutes).then((data) => ({ success: true, data }));
    }
    getWorkingHours(doctorId, req) {
        const practitionerId = doctorId || (req?.user?.fhirRef?.startsWith('Practitioner/') ? req.user.fhirRef.split('/')[1] : undefined);
        if (!practitionerId)
            return { success: true, data: { hours: [] } };
        return this.appointmentsService.getWorkingHours(practitionerId).then((data) => ({ success: true, data }));
    }
    setWorkingHours(dto, req) {
        const practitionerId = dto.doctorId || (req?.user?.fhirRef?.startsWith('Practitioner/') ? req.user.fhirRef.split('/')[1] : undefined);
        return this.appointmentsService.setWorkingHours(practitionerId, dto).then((data) => ({ success: true, data }));
    }
    listBlocked(doctorId, req) {
        const practitionerId = doctorId || (req?.user?.fhirRef?.startsWith('Practitioner/') ? req.user.fhirRef.split('/')[1] : undefined);
        if (!practitionerId)
            return { success: true, data: [] };
        return this.appointmentsService.listBlocked(practitionerId).then((data) => ({ success: true, data }));
    }
    createBlocked(dto, req) {
        const practitionerId = dto.doctorId || (req?.user?.fhirRef?.startsWith('Practitioner/') ? req.user.fhirRef.split('/')[1] : undefined);
        return this.appointmentsService.createBlocked(practitionerId, dto).then((data) => ({ success: true, data }));
    }
    deleteBlocked(id) {
        return this.appointmentsService.deleteBlocked(id).then(() => ({ success: true }));
    }
};
exports.AppointmentsController = AppointmentsController;
__decorate([
    (0, common_1.Post)('book'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "book", null);
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_appointment_dto_js_1.CreateAppointmentDto]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/checkin'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "startCheckIn", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "getById", null);
__decorate([
    (0, common_1.Get)(':id/required-exams'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "getRequiredExams", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "me", null);
__decorate([
    (0, common_1.Get)('doctors/:id/availability'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __param(2, (0, common_1.Query)('slotMinutes')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "getAvailability", null);
__decorate([
    (0, common_1.Get)('working-hours'),
    __param(0, (0, common_1.Query)('doctorId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "getWorkingHours", null);
__decorate([
    (0, common_1.Post)('working-hours'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_working_hours_dto_js_1.SetWorkingHoursDto, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "setWorkingHours", null);
__decorate([
    (0, common_1.Get)('blocked'),
    __param(0, (0, common_1.Query)('doctorId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "listBlocked", null);
__decorate([
    (0, common_1.Post)('blocked'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_blocked_time_dto_js_1.CreateBlockedTimeDto, Object]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "createBlocked", null);
__decorate([
    (0, common_1.Delete)('blocked/:id'),
    (0, roles_decorator_js_1.Roles)(roles_decorator_js_1.Role.DOCTOR),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AppointmentsController.prototype, "deleteBlocked", null);
exports.AppointmentsController = AppointmentsController = __decorate([
    (0, common_1.Controller)('appointments'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('cognito'), roles_guard_js_1.RolesGuard),
    __metadata("design:paramtypes", [appointments_service_js_1.AppointmentsService])
], AppointmentsController);
//# sourceMappingURL=appointments.controller.js.map