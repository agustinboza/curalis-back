"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorsModule = void 0;
const common_1 = require("@nestjs/common");
const fhir_module_js_1 = require("../fhir/fhir.module.js");
const doctors_controller_js_1 = require("./doctors.controller.js");
const doctors_service_js_1 = require("./doctors.service.js");
const roles_guard_js_1 = require("../auth/guards/roles.guard.js");
let DoctorsModule = class DoctorsModule {
};
exports.DoctorsModule = DoctorsModule;
exports.DoctorsModule = DoctorsModule = __decorate([
    (0, common_1.Module)({
        imports: [fhir_module_js_1.FhirModule],
        controllers: [doctors_controller_js_1.DoctorsController],
        providers: [doctors_service_js_1.DoctorsService, roles_guard_js_1.RolesGuard],
    })
], DoctorsModule);
//# sourceMappingURL=doctors.module.js.map